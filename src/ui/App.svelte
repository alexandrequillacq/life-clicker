<script lang="ts">
  import { game, resetGame } from "./store.svelte";
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

<button class="reset" onclick={resetGame} aria-label="Réinitialiser la partie (test)">reset</button>

<main data-act="1">
  {#if s.flags.moneyVisible}
    <p class="counter">Argent : {fmtMoney(s.money)}</p>
  {/if}

  <p class="job">Métier : Plongeur</p>

  <button class="action" onclick={() => clickWork(s)}>Laver une assiette</button>

  {#each GENERATORS as g (g.id)}
    {#if s.flags[`gen_${g.id}_unlocked`]}
      <div class="gen">
        <div class="gen-head">
          <button
            class="buy"
            disabled={!canBuyGenerator(s, g.id)}
            onclick={() => buyGenerator(s, g.id)}
          >{g.label}</button>
          {#if s.generators[g.id]}<span class="gen-count">{s.generators[g.id]}</span>{/if}
        </div>
        <p class="gen-price">Prix : {fmtMoney(generatorCost(s, g.id))}</p>
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
    margin: 0 0 0.5rem;
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
    margin: 0.45rem 0;
  }

  .gen-head {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
  }

  .buy {
    padding: 0.25rem 0.6rem;
  }

  .gen-count {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .gen-price {
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

  /* Bouton de test discret, en haut à droite. */
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
