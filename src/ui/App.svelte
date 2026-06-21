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
  {#if s.flags.moneyVisible}
    <p class="counter">Argent : {fmtMoney(s.money)}</p>
  {/if}

  <p class="job">Métier : Plongeur</p>

  <button class="action" onclick={() => clickWork(s)}>Laver une assiette</button>

  {#each GENERATORS as g (g.id)}
    {#if s.flags[`gen_${g.id}_unlocked`]}
      <div class="gen">
        <button
          class="buy"
          disabled={!canBuyGenerator(s, g.id)}
          onclick={() => buyGenerator(s, g.id)}
        >
          <span class="buy-label">{g.label}</span>
          <span class="buy-cost">{fmtMoney(generatorCost(s, g.id))}</span>
        </button>
        {#if s.generators[g.id]}<span class="gen-count">{s.generators[g.id]}</span>{/if}
      </div>
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

  .gen {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    margin: 0.15rem 0;
  }

  .buy {
    display: flex;
    justify-content: space-between;
    gap: 1.5rem;
    min-width: 16rem;
    padding: 0.25rem 0.6rem;
    text-align: left;
  }

  .buy-cost {
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

  .buy:disabled .buy-cost {
    color: var(--muted);
  }

  .gen-count {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
</style>
