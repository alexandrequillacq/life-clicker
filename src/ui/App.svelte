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
  <h1>Plongeur</h1>

  {#if game.offlineEarned}
    <p class="offline">Pendant ton absence, tu as gagné {fmtMoney(game.offlineEarned)}.</p>
  {/if}

  {#if s.flags.moneyVisible}
    <div class="counter">{fmtMoney(s.money)}</div>
  {/if}

  <button class="action" onclick={() => clickWork(s)}>Laver une assiette</button>

  {#each GENERATORS as g (g.id)}
    {#if s.flags[`gen_${g.id}_unlocked`]}
      <button
        class="buy"
        disabled={!canBuyGenerator(s, g.id)}
        onclick={() => buyGenerator(s, g.id)}
      >
        {g.label} — {fmtMoney(generatorCost(s, g.id))}
        {#if s.generators[g.id]}<span class="owned">×{s.generators[g.id]}</span>{/if}
      </button>
    {/if}
  {/each}
</main>

<style>
  :global(body) {
    margin: 0;
  }
  main[data-act="1"] {
    --bg: #0a0a0a;
    --fg: #d6d6d6;
    --line: #333;
    background: var(--bg);
    color: var(--fg);
    font-family: "Courier New", monospace;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    padding: 2rem;
  }
  h1 {
    font-weight: normal;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    font-size: 1rem;
    opacity: 0.6;
    margin: 0;
  }
  .counter {
    font-size: 2.5rem;
    font-variant-numeric: tabular-nums;
  }
  .offline {
    opacity: 0.7;
    font-style: italic;
  }
  button {
    background: transparent;
    color: var(--fg);
    border: 1px solid var(--line);
    padding: 0.6rem 1.2rem;
    font-family: inherit;
    font-size: 1rem;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  button:hover:not(:disabled) {
    border-color: var(--fg);
  }
  button:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .action {
    font-size: 1.1rem;
  }
  .owned {
    opacity: 0.6;
    margin-left: 0.5rem;
  }
</style>
