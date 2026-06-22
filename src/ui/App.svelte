<script lang="ts">
  import { game, resetGame, doubleMoney } from "./store.svelte";
  import {
    work,
    buyGenerator,
    generatorCost,
    canBuyGenerator,
    buyUpgrade,
    canBuyUpgrade,
    upgradeAvailable,
    poseGants,
    rest,
    study,
    canStudy,
    becomeDeveloper,
    promote,
    canPromote,
    buyFollowers,
    canBuyFollowers,
    followerPackCost,
    fireTeam,
    canFireTeam,
    buyHome,
    canBuyHome,
  } from "../engine/actions";
  import { GENERATORS, generatorAvailable } from "../engine/content/generators";
  import { UPGRADES } from "../engine/content/upgrades";
  import { JOBS, nextPromotion } from "../engine/content/career";
  import { nextBook } from "../engine/content/studies";
  import { currentHome, nextHome } from "../engine/content/homes";
  import { fmtMoney, fmtNumber } from "../engine/numbers";
  import { aiIncomePerSec, incomePerSec } from "../engine/economy";
  import type { Job } from "../engine/state";

  const s = $derived(game.state);
  const job = $derived(JOBS[s.job]);
  const book = $derived(nextBook(s.studyLevel));
  const promo = $derived(nextPromotion(s.job));
  const clickLabel = $derived(s.job === "plongeur" ? "Laver des assiettes" : job.clickLabel);
  const perMinute = $derived(incomePerSec(s).mul(60));
  const home = $derived(currentHome(s.homeLevel));
  const homeNext = $derived(nextHome(s.homeLevel));

  // Le clic actif (gagner de l'argent / des followers) disparaît dès qu'on devient manager.
  const showWork = $derived(
    (s.job === "plongeur" && !s.manualRetired) || s.job === "developpeur" || s.job === "celebrite",
  );
  // Le dev IC ne peut plus cliquer s'il est épuisé : l'énergie limite la cadence (pas le gain).
  const workExhausted = $derived(s.job === "developpeur" && s.energy < job.clickEnergyCost);

  // Titre de la fenêtre (l'écran ressemble à une appli ; remplace le « Métier : … »).
  const APP_TITLES: Record<Job, string> = {
    plongeur: "Plonge",
    developpeur: "Résolveur de bugs",
    lead_dev: "Console d'équipe",
    cto: "Console technique",
    entrepreneur: "Console de direction",
    celebrite: "Studio d'image",
    politique: "Cabinet",
  };
  const appTitle = $derived(APP_TITLES[s.job]);

  const hasUpgrades = $derived(UPGRADES.some((u) => upgradeAvailable(s, u)));
  const hasGenerators = $derived(
    GENERATORS.some(
      (g) =>
        s.flags[`gen_${g.id}_unlocked`] &&
        generatorAvailable(g, s.job) &&
        !(g.team && s.flags.equipeRemplacee),
    ),
  );

  // L'écran (panneau de jeu) peut être réduit pour admirer le décor (le logement).
  let screenOpen = $state(true);
</script>

{#snippet upgradesList()}
  {#each UPGRADES as u (u.id)}
    {#if upgradeAvailable(s, u)}
      <div class="row">
        <button class="buy" disabled={!canBuyUpgrade(s, u.id)} onclick={() => buyUpgrade(s, u.id)}>{u.label}</button>
        {#if u.grantCash}
          <span class="price">+{fmtMoney(u.grantCash)}</span>
        {:else}
          <span class="price">{fmtMoney(u.cost)}</span>
        {/if}
      </div>
    {/if}
  {/each}
{/snippet}

{#snippet generatorsList()}
  {#each GENERATORS as g (g.id)}
    {#if s.flags[`gen_${g.id}_unlocked`] && generatorAvailable(g, s.job) && !(g.team && s.flags.equipeRemplacee)}
      <div class="row">
        <button class="buy" disabled={!canBuyGenerator(s, g.id)} onclick={() => buyGenerator(s, g.id)}>{g.label}</button>
        {#if s.generators[g.id]}<span class="count">×{s.generators[g.id]}</span>{/if}
        <span class="price">{fmtMoney(generatorCost(s, g.id))}</span>
      </div>
    {/if}
  {/each}
{/snippet}

<div class="debug">
  <button class="dbg" onclick={doubleMoney} aria-label="Doubler l'argent (test)">×2</button>
  <button class="dbg" onclick={resetGame} aria-label="Réinitialiser la partie (test)">reset</button>
  <span class="ver">{__GIT_HASH__}</span>
</div>

{#if s.job === "plongeur"}
  <!-- Acte I : plongeur. Texte brut, fond blanc, minimal (esprit Paperclips). -->
  <main class="paper">
    {#if s.flags.moneyVisible}<p class="counter">Argent : {fmtMoney(s.money)}</p>{/if}
    {#if s.flags.moneyVisible && perMinute.gt(0)}<p class="line muted">Revenu : {fmtMoney(perMinute)} / min</p>{/if}
    {#if s.flags.energyVisible}<p class="line">Énergie : {Math.round(s.energy)} / 100</p>{/if}
    <p class="job">Métier : {job.label}</p>
    {#if showWork}<button class="action" onclick={() => work(s)}>{clickLabel}</button>{/if}
    {@render upgradesList()}
    {@render generatorsList()}
    {#if s.flags.poseGantsVisible && !s.manualRetired}
      <button class="action" onclick={() => poseGants(s)}>Poser les gants</button>
    {/if}
    {#if s.flags.lifeVisible}
      <section class="pblock"><p class="job">Vie</p><button class="action" onclick={() => rest(s)}>Se reposer</button></section>
    {/if}
    {#if s.flags.studyVisible}
      <section class="pblock">
        <p class="job">Études</p>
        {#if book}
          <div class="row">
            <button class="buy" disabled={!canStudy(s)} onclick={() => study(s)}>Lire « {book.label} »</button>
            <span class="price">{fmtMoney(book.cost)}</span>
          </div>
        {/if}
        {#if s.flags.postulerVisible}
          <button class="action" onclick={() => becomeDeveloper(s)}>Postuler comme développeur</button>
        {/if}
      </section>
    {/if}
  </main>
{:else}
  <!-- À partir du développeur : décor = logement du joueur, l'interface est un « écran » design. -->
  <div class="stage" style:background-image={home.bg}>
    <button class="screen-toggle" onclick={() => (screenOpen = !screenOpen)}>
      {screenOpen ? "Réduire l'écran" : "Ouvrir l'écran"}
    </button>
    {#if screenOpen}
      <main class="screen" data-act={s.flags.act2 ? "2" : "1"} data-phase={s.job}>
        <header class="winbar">
          <span class="dot dr"></span><span class="dot dy"></span><span class="dot dg"></span>
          <span class="wintitle">{appTitle}</span>
        </header>

        <div class="dash">
          <div class="stats">
            {#if s.flags.moneyVisible}
              <div class="tile accent">
                <span class="tk">Argent</span>
                <span class="tv">{fmtMoney(s.money)}</span>
              </div>
            {/if}
            {#if s.flags.moneyVisible && perMinute.gt(0)}
              <div class="tile">
                <span class="tk">Revenu</span>
                <span class="tv">{fmtMoney(perMinute)}<span class="tu"> / min</span></span>
              </div>
            {/if}
            {#if s.flags.energyVisible}
              <div class="tile">
                <span class="tk">Énergie</span>
                <div class="bar"><div class="bar-fill" style:width="{Math.round(s.energy)}%"></div></div>
              </div>
            {/if}
            {#if s.job === "celebrite" || s.followers.gt(0)}
              <div class="tile">
                <span class="tk">Followers</span>
                <span class="tv">{fmtNumber(s.followers)}</span>
              </div>
            {/if}
          </div>

          {#if s.flags.aiResolving}
            <p class="srcline"><span class="led"></span> L'IA résout les bugs : {fmtMoney(aiIncomePerSec(s))} / s</p>
          {/if}

          {#if s.flags.sensRevealed}
            <div class="sensbox">
              <span>Tu as tout.</span>
              <span class="sensval">Sens : {Math.round(s.sens)} / 100</span>
            </div>
          {/if}

          {#if showWork}
            <button class="primary" disabled={workExhausted} onclick={() => work(s)}>
              {workExhausted ? "Épuisé, repose-toi" : clickLabel}
            </button>
          {/if}

          {#if hasUpgrades}
            <section class="group">
              <h3>Améliorations</h3>
              {@render upgradesList()}
            </section>
          {/if}

          {#if hasGenerators}
            <section class="group">
              <h3>Équipe et automatisation</h3>
              {@render generatorsList()}
            </section>
          {/if}

          {#if canFireTeam(s)}
            <button class="primary ghost-danger" onclick={() => fireTeam(s)}>Remplacer l'équipe par l'IA</button>
          {/if}

          {#if s.job === "celebrite"}
            <section class="group">
              <h3>Audience</h3>
              <div class="row">
                <button class="buy" disabled={!canBuyFollowers(s)} onclick={() => buyFollowers(s)}>Acheter des followers</button>
                <span class="price">{fmtMoney(followerPackCost(s))}</span>
              </div>
            </section>
          {/if}

          <div class="footer-actions">
            {#if homeNext && s.money.gte(homeNext.unlockAtMoney)}
              <button class="ghost" disabled={!canBuyHome(s)} onclick={() => buyHome(s)}>{homeNext.cta} · {fmtMoney(homeNext.cost)}</button>
            {/if}
            {#if s.flags.lifeVisible}
              <button class="ghost" onclick={() => rest(s)}>Se reposer</button>
            {/if}
            {#if promo && canPromote(s)}
              <button class="promote" onclick={() => promote(s)}>{promo.cta}</button>
            {/if}
          </div>

          {#if s.job === "politique"}
            <p class="srcline muted">Tu entres en politique. (la suite arrive)</p>
          {/if}
        </div>
      </main>
    {/if}
  </div>
{/if}

<style>
  :global(html, body) {
    margin: 0;
    background: #ffffff;
  }

  /* ---------- Acte I : plongeur (papier blanc minimal) ---------- */
  .paper {
    --fg: #111111;
    --muted: #777777;
    --line: #cccccc;
    --accent: #111111;
    background: #ffffff;
    color: var(--fg);
    font-family: "Times New Roman", Times, Georgia, serif;
    font-size: 16px;
    line-height: 1.7;
    min-height: 100vh;
    box-sizing: border-box;
    max-width: 560px;
    padding: 2.5rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
    font-variant-numeric: tabular-nums;
  }
  .paper .counter {
    margin: 0 0 0.25rem;
  }
  .paper .line {
    margin: 0;
  }
  .paper .muted {
    color: var(--muted);
  }
  .paper .job {
    margin: 0.5rem 0 0.25rem;
    color: var(--muted);
  }
  .paper .action,
  .paper .buy {
    font-family: inherit;
    font-size: inherit;
    color: var(--fg);
    background: #ffffff;
    border: 1px solid var(--line);
    border-radius: 0;
    padding: 0.25rem 0.6rem;
    cursor: pointer;
  }
  .paper .action {
    margin: 0.15rem 0;
  }
  .paper .row {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    margin: 0.35rem 0;
  }
  .paper .price,
  .paper .count {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .paper .pblock {
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--line);
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }
  .paper button:hover:not(:disabled) {
    background: #f0f0f0;
  }
  .paper button:disabled {
    color: var(--muted);
    border-color: #e5e5e5;
    cursor: default;
  }

  /* ---------- À partir du dev : décor (logement) plein écran ---------- */
  .stage {
    min-height: 100vh;
    background-color: #17191c;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    padding: 4vh 2vw 3vh;
    box-sizing: border-box;
  }

  /* ---------- L'écran : une vraie interface (fenêtre + tableau de bord) ---------- */
  .screen {
    --fg: #1b2330;
    --muted: #6b7686;
    --line: #e4e8ef;
    --card: #f4f6fa;
    --accent: #2f6df0;
    width: 100%;
    max-width: 680px;
    max-height: 84vh;
    overflow-y: auto;
    background: #ffffff;
    color: var(--fg);
    font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
    font-size: 15px;
    border-radius: 16px;
    box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
    box-sizing: border-box;
    font-variant-numeric: tabular-nums;
  }
  /* Accent qui se réchauffe à mesure qu'on monte (dev → CTO → direction). */
  .screen[data-phase="lead_dev"] {
    --accent: #2a72e6;
  }
  .screen[data-phase="cto"] {
    --accent: #1f8a78;
  }
  .screen[data-phase="entrepreneur"],
  .screen[data-act="2"] {
    --accent: #b07d2a;
  }

  .winbar {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 11px 16px;
    border-bottom: 1px solid var(--line);
    position: sticky;
    top: 0;
    background: #ffffff;
    border-radius: 16px 16px 0 0;
  }
  .dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    display: inline-block;
  }
  .dr {
    background: #e2554e;
  }
  .dy {
    background: #e6b540;
  }
  .dg {
    background: #39b54a;
  }
  .wintitle {
    margin-left: 8px;
    font-size: 13px;
    color: var(--muted);
    font-weight: 500;
  }

  .dash {
    padding: 16px 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
  }
  .tile {
    background: var(--card);
    border-radius: 10px;
    padding: 11px 13px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .tk {
    font-size: 12px;
    color: var(--muted);
  }
  .tv {
    font-size: 21px;
    font-weight: 500;
  }
  .tu {
    font-size: 13px;
    color: var(--muted);
    font-weight: 400;
  }
  .tile.accent .tv {
    color: var(--accent);
  }
  .bar {
    height: 9px;
    border-radius: 6px;
    background: #dfe4ec;
    overflow: hidden;
    margin-top: 6px;
  }
  .bar-fill {
    height: 100%;
    background: var(--accent);
    transition: width 0.2s;
  }

  .srcline {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .led {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #39b54a;
    box-shadow: 0 0 0 3px rgba(57, 181, 74, 0.18);
  }

  .sensbox {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 11px 14px;
    border: 1px solid var(--line);
    border-radius: 10px;
    color: var(--muted);
    font-size: 14px;
  }
  .sensval {
    font-variant-numeric: tabular-nums;
  }

  .primary {
    width: 100%;
    background: var(--accent);
    color: #ffffff;
    border: none;
    border-radius: 10px;
    padding: 13px;
    font-size: 15px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
  }
  .primary:hover:not(:disabled) {
    filter: brightness(1.06);
  }
  .primary:disabled {
    background: var(--card);
    color: var(--muted);
    cursor: default;
  }
  .primary.ghost-danger {
    background: #ffffff;
    color: #b23b34;
    border: 1.5px solid #e7b5b1;
  }
  .primary.ghost-danger:hover {
    background: #fdf1f0;
    filter: none;
  }

  .group {
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 6px 12px 10px;
  }
  .group h3 {
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 10px 0 6px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 0;
  }
  .row + .row {
    border-top: 1px solid var(--line);
  }
  .buy {
    flex: 1;
    text-align: left;
    font-family: inherit;
    font-size: 14px;
    color: var(--fg);
    background: #ffffff;
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 9px 11px;
    cursor: pointer;
  }
  .buy:hover:not(:disabled) {
    border-color: var(--accent);
    background: #f7f9fd;
  }
  .buy:disabled {
    color: var(--muted);
    background: var(--card);
    cursor: default;
  }
  .count {
    font-size: 13px;
    color: var(--muted);
  }
  .price {
    font-size: 13px;
    color: var(--muted);
    min-width: max-content;
  }

  .footer-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 2px;
  }
  .ghost {
    font-family: inherit;
    font-size: 13px;
    color: var(--fg);
    background: #ffffff;
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 9px 12px;
    cursor: pointer;
  }
  .ghost:hover:not(:disabled) {
    border-color: var(--accent);
  }
  .ghost:disabled {
    color: var(--muted);
    background: var(--card);
    cursor: default;
  }
  .promote {
    margin-left: auto;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    color: #ffffff;
    background: var(--accent);
    border: none;
    border-radius: 8px;
    padding: 9px 14px;
    cursor: pointer;
  }
  .promote:hover {
    filter: brightness(1.06);
  }

  .muted {
    color: var(--muted);
  }

  .screen-toggle {
    position: fixed;
    top: 0.5rem;
    left: 0.75rem;
    z-index: 5;
    font-family: -apple-system, system-ui, sans-serif;
    font-size: 13px;
    color: #ffffff;
    background: rgba(0, 0, 0, 0.45);
    border: none;
    border-radius: 8px;
    padding: 0.35rem 0.7rem;
    cursor: pointer;
    backdrop-filter: blur(4px);
  }
  .screen-toggle:hover {
    background: rgba(0, 0, 0, 0.65);
  }

  /* ---------- Outils de test (discrets, haut droite) ---------- */
  .debug {
    position: fixed;
    top: 0.5rem;
    right: 0.75rem;
    z-index: 6;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .dbg {
    border: none;
    background: transparent;
    color: #dddddd;
    font-family: "Times New Roman", Times, Georgia, serif;
    font-size: 12px;
    padding: 0.15rem 0.3rem;
    cursor: pointer;
  }
  .dbg:hover {
    color: #999999;
  }
  .ver {
    color: #c9ccd2;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
  }
</style>
