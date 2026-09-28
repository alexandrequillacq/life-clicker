<script lang="ts">
  // Acte I, chapitre 1 : le plongeur. Papier blanc, texte brut, boutons carrés (esprit Paperclips).
  // Deux colonnes : « Travail » (le restaurant) et « Ta vie » (l'énergie, les études, Maman, les souvenirs).
  // Chaque élément a une place fixe : ce qui apparaît s'insère, rien ne décale le bouton « Laver ».
  // Ce composant n'invente rien : chaque bloc, ses libellés et ses sous-titres viennent de engine/plonge/vue.ts
  // (null = bloc caché).
  import { game } from "./store.svelte";
  import {
    vueEntete,
    vueTelephone,
    vueTitreTravail,
    vueJour,
    vuePile,
    vueCouverts,
    vueLaver,
    vueLaveVaisselle,
    vueConcessions,
    vueAmelioration,
    vueChef,
    vueBanque,
    vuePoserGants,
    vueAnnonce,
    vueVie,
    vueAppel,
    vueRepas,
    vueEtudes,
    vueTeaserEtudes,
    vueFenetre,
    vueSouvenirs,
  } from "../engine/plonge";

  const s = $derived(game.state);
  const entete = $derived(vueEntete(s));
  const phone = $derived(vueTelephone(s));
  const titreTravail = $derived(vueTitreTravail(s));
  const jour = $derived(vueJour(s));
  const pile = $derived(vuePile(s));
  const couverts = $derived(vueCouverts(s));
  const laver = $derived(vueLaver(s));
  const machine = $derived(vueLaveVaisselle(s));
  const concessions = $derived(vueConcessions(s));
  const amelioration = $derived(vueAmelioration(s));
  const chef = $derived(vueChef(s));
  const banque = $derived(vueBanque(s));
  const poserGants = $derived(vuePoserGants(s));
  const annonce = $derived(vueAnnonce(s));
  const vie = $derived(vueVie(s));
  const appel = $derived(vueAppel(s));
  const repas = $derived(vueRepas(s));
  const etudes = $derived(vueEtudes(s));
  const teaser = $derived(vueTeaserEtudes(s));
  const fenetre = $derived(vueFenetre(s));
  const souvenirs = $derived(vueSouvenirs(s));
</script>

{#snippet achat(b: { label: string; price?: string; lines: string[]; disabled: boolean; act: () => void })}
  <button class="bt" disabled={b.disabled} onclick={b.act}>{b.label}</button>
  {#if b.price}<span class="price">{b.price}</span>{/if}
  {#each b.lines as l}<p class="sub">{l}</p>{/each}
{/snippet}

<main class="plonge">
  <header class="top">
    <p class="chef">{entete.chef}</p>
    {#if entete.money}<p class="money">{entete.money}</p>{/if}
    {#if entete.auto}<p class="sub auto">{entete.auto}</p>{/if}
  </header>

  <!-- Au téléphone avec Maman, tout s'arrête : chaque bouton est grisé le temps de l'appel. -->
  <fieldset class="cols" class:solo={!vie} disabled={phone}>
    <section class="col travail" aria-label="Travail">
      {#if titreTravail}<h2>{titreTravail}</h2>{/if}
      {#if jour}<p>{jour}</p>{/if}
      {#if pile}
        <p class="pile">{pile[0]}</p>
        <!-- Place réservée (deux lignes, affichées ou non) : ce qui s'y écrit ne décale jamais le bouton « Laver ». -->
        <div class="pile-notes">{#each pile.slice(1, 3) as l}<p class="sub">{l}</p>{/each}</div>
      {/if}
      {#if couverts}<p class="sub">{couverts}</p>{/if}

      {#if laver}
        <button class="bt wash" disabled={laver.disabled} onclick={laver.act}>{laver.label}</button>
      {/if}

      {#if machine}
        <h3>{machine.title}</h3>
        <p>{machine.status}</p>
      {/if}

      {#if amelioration}
        <h3>{amelioration.title}</h3>
        <div class="buy">{@render achat(amelioration.buy)}</div>
      {/if}

      {#if concessions}
        <h3>{concessions.title}</h3>
        {#each concessions.offers as o (o.label)}
          <div class="buy">{@render achat(o)}</div>
        {/each}
      {/if}

      {#if chef}
        <h3>{chef.title}</h3>
        {#each chef.offers as o (o.label)}
          <div class="buy">{@render achat(o)}</div>
        {/each}
      {/if}

      {#if banque}
        <h3>{banque.title}</h3>
        {#each banque.lines as l}<p class="sub">{l}</p>{/each}
        {#each banque.buttons as b (b.label)}
          <div class="buy">{@render achat(b)}</div>
        {/each}
      {/if}

      {#if poserGants}
        <div class="buy pivot">{@render achat(poserGants)}</div>
      {/if}

      {#if annonce}
        <div class="annonce">
          <p>{annonce.text}</p>
          {@render achat(annonce.buy)}
        </div>
      {/if}
    </section>

    {#if vie}
      <section class="col vie" aria-label="Ta vie">
        <h2>{vie.title}</h2>
        <p class="sub">{vie.age}</p>
        {#if vie.energy}<p>{vie.energy}</p>{/if}

        {#if appel}
          <div class="call">
            <p>{appel.text}</p>
            {#if appel.answer}{@render achat(appel.answer)}{/if}
            {#each appel.lines as l}<p class="sub">{l}</p>{/each}
          </div>
        {/if}

        {#if repas}
          <div class="buy">{@render achat(repas)}</div>
        {/if}

        {#if etudes}
          <h3>{etudes.title}</h3>
          {#each etudes.items as item (item.id)}
            <div class="study">
              <p>{item.name}</p>
              {#if item.done}<p class="sub">{item.done}</p>{/if}
              {#if item.progress}
                <p class="progress">
                  <span class="bar"><i style="width: {item.progress.share * 100}%"></i></span>
                  <span class="sub">{item.progress.text}</span>
                </p>
              {/if}
              {#if item.step}{@render achat(item.step)}{/if}
            </div>
          {/each}
          {#if etudes.buy}
            <div class="buy">{@render achat(etudes.buy)}</div>
          {/if}
        {/if}
        {#if teaser}<p class="sub">{teaser}</p>{/if}

        {#if fenetre}
          <button class="bt window" onclick={fenetre.act}>{fenetre.label}</button>
        {/if}

        {#if souvenirs}
          <h3>{souvenirs.title}</h3>
          <ul class="souvenirs">
            {#each souvenirs.items as m, i (i)}
              <li class:missed={m.missed}>{m.text}</li>
            {/each}
          </ul>
        {/if}
      </section>
    {/if}
  </fieldset>
</main>

<style>
  .plonge {
    --fg: #111111;
    --muted: #777777;
    --line: #cccccc;
    background: #ffffff;
    color: var(--fg);
    font-family: "Times New Roman", Times, Georgia, serif;
    font-size: 16px;
    line-height: 1.6;
    min-height: 100vh;
    box-sizing: border-box;
    max-width: 920px;
    padding: 2.5rem 1.5rem;
    font-variant-numeric: tabular-nums;
  }
  p {
    margin: 0;
  }
  .top {
    margin-bottom: 1.25rem;
  }
  .chef {
    color: var(--muted);
    font-style: italic;
    min-height: 1.6em;
  }
  .money {
    margin-top: 0.4rem;
  }
  .cols {
    border: 0;
    margin: 0;
    padding: 0;
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 2.5rem;
    align-items: start;
  }
  .cols.solo {
    grid-template-columns: minmax(0, 1fr);
    max-width: 460px;
  }
  @media (max-width: 720px) {
    .cols {
      grid-template-columns: minmax(0, 1fr);
      gap: 1.5rem;
    }
  }
  h2,
  h3 {
    font-size: inherit;
    font-weight: normal;
    color: var(--muted);
    margin: 0 0 0.35rem;
  }
  h2 {
    padding-bottom: 0.3rem;
    border-bottom: 1px solid var(--line);
  }
  h3 {
    margin-top: 1rem;
    padding-top: 0.6rem;
    border-top: 1px solid var(--line);
  }
  .sub {
    color: var(--muted);
    font-size: 14px;
  }
  .pile-notes {
    height: 2.6em;
    font-size: 14px;
  }
  .pile-notes p {
    line-height: 1.3em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .bt {
    font-family: inherit;
    font-size: inherit;
    color: var(--fg);
    background: #ffffff;
    border: 1px solid var(--line);
    border-radius: 0;
    padding: 0.2rem 0.6rem;
    margin: 0.2rem 0.4rem 0.1rem 0;
    cursor: pointer;
    text-align: left;
  }
  .bt:hover:not(:disabled) {
    border-color: var(--fg);
  }
  .bt:disabled {
    color: #aaaaaa;
    cursor: default;
  }
  .wash {
    margin-top: 0.6rem;
  }
  .price {
    color: var(--muted);
  }
  .buy {
    margin: 0.5rem 0;
  }
  .pivot,
  .annonce {
    margin-top: 1rem;
    padding-top: 0.6rem;
    border-top: 1px solid var(--line);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
  }
  .call {
    border: 1px solid var(--fg);
    padding: 0.4rem 0.6rem;
    margin: 0.6rem 0;
  }
  .study {
    margin: 0.5rem 0 0.75rem;
  }
  .progress {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .bar {
    display: inline-block;
    width: 110px;
    height: 6px;
    border: 1px solid var(--muted);
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--fg);
  }
  .window {
    margin-top: 1rem;
  }
  .souvenirs {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 15px;
  }
  .souvenirs li::before {
    content: "●";
    margin-right: 0.4rem;
    font-size: 9px;
    vertical-align: 2px;
  }
  .souvenirs li.missed {
    color: var(--muted);
  }
  .souvenirs li.missed::before {
    content: "○";
  }
</style>
