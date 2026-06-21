<script lang="ts">
  import { game, resetGame } from "./store.svelte";
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
  } from "../engine/actions";
  import { GENERATORS } from "../engine/content/generators";
  import { UPGRADES } from "../engine/content/upgrades";
  import { JOBS, nextPromotion } from "../engine/content/career";
  import { nextBook } from "../engine/content/studies";
  import { fmtMoney } from "../engine/numbers";
  import { aiIncomePerSec } from "../engine/economy";

  const s = $derived(game.state);
  const job = $derived(JOBS[s.job]);
  const book = $derived(nextBook(s.studyLevel));
  const promo = $derived(nextPromotion(s.job));
  const clickLabel = $derived(s.job === "plongeur" ? "Laver des assiettes" : job.clickLabel);
</script>

<button class="reset" onclick={resetGame} aria-label="Réinitialiser la partie (test)">reset</button>

<main data-act="1">
  {#if s.flags.moneyVisible}
    <p class="counter">Argent : {fmtMoney(s.money)}</p>
  {/if}

  {#if s.flags.energyVisible}
    <p class="line">Énergie : {Math.round(s.energy)} / 100</p>
  {/if}

  {#if s.flags.aiResolving}
    <p class="line muted">L'IA résout les bugs : {fmtMoney(aiIncomePerSec(s))} / s</p>
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
        <p class="price">Prix : {fmtMoney(u.cost)}</p>
      </div>
    {/if}
  {/each}

  <!-- Générateurs : plonge (si plongeur) ou dev (sinon) -->
  {#each GENERATORS as g (g.id)}
    {#if s.flags[`gen_${g.id}_unlocked`] && (g.kind === "plonge" ? s.job === "plongeur" : s.job !== "plongeur")}
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

  {#if s.job === "entrepreneur"}
    <p class="line muted">Ta boîte d'IA est lancée. (la suite arrive)</p>
  {/if}
</main>

<style>
  :global(html, body) {
    margin: 0;
    background: #ffffff;
  }

  main[data-act="1"] {
    /* Acte I : texte brut, fond blanc, minimal (esprit Paperclips). */
    --bg: #ffffff;
    --fg: #111111;
    --muted: #777777;
    --line: #cccccc;

    background: var(--bg);
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
  }

  .counter {
    margin: 0 0 0.25rem;
    font-variant-numeric: tabular-nums;
  }

  .line {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }

  .muted {
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
    font-variant-numeric: tabular-nums;
  }

  .price {
    margin: 0.15rem 0 0;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
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

  .reset {
    position: fixed;
    top: 0.5rem;
    right: 0.75rem;
    border: none;
    background: transparent;
    color: #dddddd;
    font-family: "Times New Roman", Times, Georgia, serif;
    font-size: 12px;
    padding: 0.15rem 0.3rem;
  }

  .reset:hover {
    color: #999999;
    background: transparent;
  }
</style>
