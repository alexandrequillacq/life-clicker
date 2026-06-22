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
  import { GENERATORS, generatorVisible } from "../engine/content/generators";
  import { UPGRADES } from "../engine/content/upgrades";
  import { JOBS, nextPromotion } from "../engine/content/career";
  import { nextBook } from "../engine/content/studies";
  import { currentHome, nextHome } from "../engine/content/homes";
  import { fmtMoney, fmtNumber } from "../engine/numbers";
  import { aiIncomePerSec, incomePerSec } from "../engine/economy";

  const s = $derived(game.state);
  const job = $derived(JOBS[s.job]);
  const book = $derived(nextBook(s.studyLevel));
  const promo = $derived(nextPromotion(s.job));
  const clickLabel = $derived(s.job === "plongeur" ? "Laver des assiettes" : job.clickLabel);
  const perMinute = $derived(incomePerSec(s).mul(60));
  const home = $derived(currentHome(s.homeLevel));
  const homeNext = $derived(nextHome(s.homeLevel));

  // L'écran (panneau de jeu) peut être réduit pour admirer le décor (le logement).
  let screenOpen = $state(true);
</script>

<div class="debug">
  <button class="dbg" onclick={doubleMoney} aria-label="Doubler l'argent (test)">×2</button>
  <button class="dbg" onclick={resetGame} aria-label="Réinitialiser la partie (test)">reset</button>
  <span class="ver">{__GIT_HASH__}</span>
</div>

{#snippet body()}
  {#if s.flags.moneyVisible}
    <p class="counter">Argent : {fmtMoney(s.money)}</p>
  {/if}

  {#if s.flags.moneyVisible && perMinute.gt(0)}
    <p class="line muted">Revenu : {fmtMoney(perMinute)} / min</p>
  {/if}

  {#if s.flags.energyVisible}
    <p class="line">Énergie : {Math.round(s.energy)} / 100</p>
  {/if}

  {#if s.flags.aiResolving}
    <p class="line muted">L'IA résout les bugs : {fmtMoney(aiIncomePerSec(s))} / s</p>
  {/if}

  {#if s.job === "celebrite" || s.followers.gt(0)}
    <p class="line">Followers : {fmtNumber(s.followers)}</p>
  {/if}

  {#if s.flags.sensRevealed}
    <p class="line sens">Tu as tout.</p>
    <p class="line sens">Sens : {Math.round(s.sens)} / 100</p>
  {/if}

  <p class="job">Métier : {job.label}</p>

  {#if !(s.job === "plongeur" && s.manualRetired)}
    <button class="action" onclick={() => work(s)}>{clickLabel}</button>
  {/if}

  <!-- Upgrades du métier courant -->
  {#each UPGRADES as u (u.id)}
    {#if upgradeAvailable(s, u)}
      <div class="item">
        <div class="item-head">
          <button class="buy" disabled={!canBuyUpgrade(s, u.id)} onclick={() => buyUpgrade(s, u.id)}
            >{u.label}</button>
        </div>
        {#if u.grantCash}
          <p class="price">Rapporte : {fmtMoney(u.grantCash)}</p>
        {:else}
          <p class="price">Prix : {fmtMoney(u.cost)}</p>
        {/if}
      </div>
    {/if}
  {/each}

  <!-- Générateurs : plonge (si plongeur) ou dev (sinon) -->
  {#each GENERATORS as g (g.id)}
    {#if s.flags[`gen_${g.id}_unlocked`] && generatorVisible(g.kind, s.job) && !(g.id === "junior" && s.flags.equipeRemplacee)}
      <div class="item">
        <div class="item-head">
          <button class="buy" disabled={!canBuyGenerator(s, g.id)} onclick={() => buyGenerator(s, g.id)}
            >{g.label}</button>
          {#if s.generators[g.id]}<span class="count">{s.generators[g.id]}</span>{/if}
        </div>
        <p class="price">Prix : {fmtMoney(generatorCost(s, g.id))}</p>
      </div>
    {/if}
  {/each}

  {#if s.flags.poseGantsVisible && !s.manualRetired && s.job === "plongeur"}
    <button class="action" onclick={() => poseGants(s)}>Poser les gants</button>
  {/if}

  {#if canFireTeam(s)}
    <button class="action" onclick={() => fireTeam(s)}>Remplacer l'équipe par l'IA</button>
  {/if}

  {#if s.job === "celebrite"}
    <div class="item">
      <div class="item-head">
        <button class="buy" disabled={!canBuyFollowers(s)} onclick={() => buyFollowers(s)}>Acheter des followers</button>
      </div>
      <p class="price">Prix : {fmtMoney(followerPackCost(s))}</p>
    </div>
  {/if}

  <!-- Logement : le décor de fond, des fruits honnêtes de la réussite (pas une automatisation de la vie) -->
  {#if s.job !== "plongeur"}
    <section class="block">
      <p class="job">Logement : {home.label}</p>
      {#if homeNext && s.money.gte(homeNext.unlockAtMoney)}
        <div class="item">
          <div class="item-head">
            <button class="buy" disabled={!canBuyHome(s)} onclick={() => buyHome(s)}>{homeNext.cta}</button>
          </div>
          <p class="price">Prix : {fmtMoney(homeNext.cost)}</p>
        </div>
      {/if}
    </section>
  {/if}

  <!-- Promotion vers le métier suivant -->
  {#if promo && canPromote(s)}
    <button class="action" onclick={() => promote(s)}>{promo.cta}</button>
  {/if}

  {#if s.flags.lifeVisible}
    <section class="block">
      <p class="job">Vie</p>
      <button class="action" onclick={() => rest(s)}>Se reposer</button>
    </section>
  {/if}

  {#if s.flags.studyVisible && s.job === "plongeur"}
    <section class="block">
      <p class="job">Études</p>
      {#if book}
        <div class="item">
          <div class="item-head">
            <button class="buy" disabled={!canStudy(s)} onclick={() => study(s)}>Lire « {book.label} »</button>
          </div>
          <p class="price">Prix : {fmtMoney(book.cost)}</p>
        </div>
      {/if}
      {#if s.flags.postulerVisible}
        <button class="action" onclick={() => becomeDeveloper(s)}>Postuler comme développeur</button>
      {/if}
    </section>
  {/if}

  {#if s.job === "politique"}
    <p class="line muted">Tu entres en politique. (la suite arrive)</p>
  {/if}
{/snippet}

{#if s.job === "plongeur"}
  <main class="paper">
    {@render body()}
  </main>
{:else}
  <div class="stage" style:background-image={home.bg}>
    <button class="screen-toggle" onclick={() => (screenOpen = !screenOpen)}>
      {screenOpen ? "Réduire l'écran" : "Ouvrir l'écran"}
    </button>
    {#if screenOpen}
      <main class="screen" data-act={s.flags.act2 ? "2" : "1"} class:firstcolor={s.flags.firstColor && !s.flags.act2}>
        {@render body()}
      </main>
    {/if}
  </div>
{/if}

<style>
  :global(html, body) {
    margin: 0;
    background: #ffffff;
  }

  main {
    /* Tokens par défaut (Acte I). */
    --bg: #ffffff;
    --fg: #111111;
    --muted: #777777;
    --line: #cccccc;
    --accent: #111111;

    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
    font-size: 16px;
    line-height: 1.7;
    font-variant-numeric: tabular-nums;
  }

  /* Acte I : plongeur. Texte brut, fond blanc, minimal (esprit Paperclips). */
  .paper {
    background: var(--bg);
    color: var(--fg);
    font-family: "Times New Roman", Times, Georgia, serif;
    min-height: 100vh;
    max-width: 560px;
    padding: 2.5rem 1.5rem;
  }

  /* À partir du développeur : le décor de fond est le logement du joueur. */
  .stage {
    min-height: 100vh;
    background-color: #17191c;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 3.5vh 2vw;
    box-sizing: border-box;
  }

  /* L'interface du jeu vit dans un « écran » posé sur le décor. */
  .screen {
    width: 100%;
    max-width: 720px;
    max-height: 90vh;
    overflow-y: auto;
    background: rgba(255, 255, 255, 0.96);
    color: var(--fg);
    font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
    border-radius: 14px;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
    padding: 1.75rem 1.6rem;
  }

  .screen :global(button) {
    border-radius: 7px;
    transition: border-color 0.15s, background 0.15s;
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
    border-radius: 7px;
    padding: 0.35rem 0.7rem;
    cursor: pointer;
  }
  .screen-toggle:hover {
    background: rgba(0, 0, 0, 0.65);
  }

  /* Première couleur : récompense de fin d'Acte I (on devient développeur). */
  main.firstcolor {
    --accent: #2f6df0;
  }

  /* Acte II : épuré, coloré, agréable (apogée du confort). */
  main[data-act="2"] {
    --fg: #1b2433;
    --muted: #5b6b82;
    --line: #c8d4e3;
    --accent: #2f6df0;
  }
  .screen :global(button):hover:not(:disabled) {
    background: #eef3fb;
    border-color: var(--accent);
  }

  .counter {
    margin: 0 0 0.25rem;
    color: var(--accent);
  }

  .line {
    margin: 0;
  }

  .muted {
    color: var(--muted);
  }

  /* Jauge de Sens : volontairement terne et sans couleur d'alarme. */
  .sens {
    color: var(--muted);
  }

  .job {
    margin: 0.5rem 0 0.25rem;
    color: var(--muted);
  }

  button {
    font-family: inherit;
    font-size: inherit;
    color: var(--fg);
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 0;
    cursor: pointer;
  }

  .action {
    margin: 0.15rem 0;
    padding: 0.25rem 0.6rem;
  }

  .item {
    margin: 0.4rem 0;
  }

  .item-head {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
  }

  .buy {
    padding: 0.25rem 0.6rem;
  }

  .count {
    color: var(--muted);
  }

  .price {
    margin: 0.15rem 0 0;
    color: var(--muted);
  }

  button:hover:not(:disabled) {
    background: #f0f0f0;
  }

  button:disabled {
    color: var(--muted);
    border-color: #e5e5e5;
    cursor: default;
  }

  .block {
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--line);
    width: 100%;
    box-sizing: border-box;
  }

  /* Outils de test, volontairement discrets (haut droite). */
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
  }

  .dbg:hover {
    color: #999999;
    background: transparent;
  }

  .ver {
    color: #e2e2e2;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
  }
</style>
