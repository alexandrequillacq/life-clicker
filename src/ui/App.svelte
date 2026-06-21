<script lang="ts">
  import { game } from "./store.svelte";
  import {
    clickWork,
    buyGenerator,
    generatorCost,
    canBuyGenerator,
  } from "../engine/actions";
  import { GENERATORS } from "../engine/content/generators";
  import { fmtMoney } from "../engine/numbers";

  const s = $derived(game.state);
</script>

<main data-act="1">
  {#if game.offlineEarned}
    <p class="offline">Pendant ton absence, tu as gagné {fmtMoney(game.offlineEarned)}.</p>
  {/if}

  {#if s.flags.moneyVisible}
    <p class="counter">Argent : {fmtMoney(s.money)}</p>
  {/if}

  <p class="job">Plongeur</p>

  <button class="action" onclick={() => clickWork(s)}>Laver une assiette</button>

  {#each GENERATORS as g (g.id)}
    {#if s.flags[`gen_${g.id}_unlocked`]}
      <button
        class="buy"
        disabled={!canBuyGenerator(s, g.id)}
        onclick={() => buyGenerator(s, g.id)}
      >
        {g.label} — {fmtMoney(generatorCost(s, g.id))}{#if s.generators[g.id]}
          <span class="owned">(×{s.generators[g.id]})</span>{/if}
      </button>
    {/if}
  {/each}
</main>

<style>
  :global(html, body) {
    margin: 0;
    background: #ffffff;
  }

  main[data-act="1"] {
    /* Tokens de l'Acte I : texte brut, fond blanc, minimal (esprit Paperclips). */
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
    /* aligné en haut à gauche, comme un document brut */
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .counter {
    margin: 0 0 0.5rem;
    font-variant-numeric: tabular-nums;
  }

  .job {
    margin: 0 0 0.25rem;
    color: var(--muted);
  }

  .offline {
    margin: 0 0 0.75rem;
    color: var(--muted);
    font-style: italic;
  }

  button {
    display: inline-block;
    margin: 0.15rem 0;
    padding: 0.25rem 0.6rem;
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--line);
    border-radius: 0;
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: #f0f0f0;
  }

  button:disabled {
    color: var(--muted);
    border-color: #e5e5e5;
    cursor: default;
  }

  .owned {
    color: var(--muted);
  }
</style>
