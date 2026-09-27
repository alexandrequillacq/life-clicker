<script lang="ts">
  // Acte I, chapitre 1 : le plongeur. Papier blanc, texte brut, boutons carrés (esprit Paperclips).
  // Deux colonnes : « Travail » (le restaurant) et « Ta vie » (l'énergie, les études, Maman, les souvenirs).
  // Chaque élément a une place fixe : ce qui apparaît s'insère, rien ne décale le bouton « Laver ».
  // Une information à la fois : chaque ligne n'apparaît que quand le moteur la révèle.
  import { game } from "./store.svelte";
  import { work, poseGants } from "../engine/actions";
  import {
    EQUIPMENT,
    LIBRARY,
    CHEF_LINES,
    STUDY_TEASER,
    SUNDAY_OFFER,
    LIVRET_CTA,
    ANNONCE_TEXT,
    ANNONCE_CTA,
    AGE_PLONGEUR,
  } from "../engine/content/plonge";
  import {
    dayName,
    isPeak,
    openToday,
    pileCap,
    clickPlates,
    machineRate,
    fmtEuros,
    autoIncomeLine,
    dayVisible,
    coversVisible,
    lifeVisible,
    canOpenLivret,
    openLivret,
    livretEffects,
    livretLine,
    equipmentVisible,
    canBuyEquipment,
    buyEquipment,
    equipmentEffects,
    cycleCourtAvailable,
    cycleCourtEffects,
    setCycleCourt,
    relaunchCycle,
    shelveGreasy,
    currentAsk,
    canAskChef,
    askChef,
    askEffects,
    canOfferSunday,
    offerSunday,
    canAnswerCall,
    answerCall,
    callEffects,
    onThePhone,
    canLookOutWindow,
    lookOutWindow,
    canPoseGants,
    poseGantsEffects,
    libraryVisible,
    studyBuyVisible,
    canBuyStudy,
    buyStudy,
    studyBuyEffects,
    canStudyStep,
    studyStep,
    studyStepLabel,
    studyStepEffects,
    studyProgress,
    studyDone,
    canAnswerAnnonce,
    answerAnnonce,
    ANNONCE_EFFECTS,
  } from "../engine/plonge";

  const s = $derived(game.state);
  const p = $derived(s.plonge);

  const euros = fmtEuros;
  const rate = (n: number): string => (Math.round(n * 10) / 10).toString().replace(".", ",");

  const plates = $derived(clickPlates(s));
  const washLabel = $derived(
    onThePhone(s)
      ? "Tu es au téléphone"
      : plates <= 0
        ? "Aucune assiette sale"
        : `Laver ${s.dishesPerClick === 1 ? "une assiette" : `${plates} assiette${plates > 1 ? "s" : ""}`}`,
  );
  const dayLine = $derived(
    !openToday(s) ? `${dayName(s)}, restaurant fermé` : isPeak(s) ? `${dayName(s)}, coup de feu de midi` : dayName(s),
  );
  const nextEquipment = $derived(EQUIPMENT.find((e) => equipmentVisible(s, e)) ?? null);
  const ask = $derived(canAskChef(s) ? currentAsk(s) : null);
  const vie = $derived(lifeVisible(s));
  const studiesOwned = $derived(LIBRARY.filter((l) => l.id in p.library));
  const nextStudy = $derived(LIBRARY.find((l) => studyBuyVisible(s, l.id)) ?? null);
  const souvenirLine = (text: string): string => (text.startsWith("Tu ") ? `t${text.slice(1)}` : text);
</script>

<main class="plonge">
  <header class="top">
    <p class="chef">{CHEF_LINES[p.chef]}</p>
    {#if s.flags.moneyVisible}
      <p class="money">Argent : {euros(s.money.toNumber())}</p>
    {/if}
    {#if p.oldRate > 0}
      <p class="sub auto">{autoIncomeLine(s)}</p>
    {/if}
    {#if p.livret}
      <p class="sub">{livretLine(s)}</p>
    {/if}
  </header>

  <div class="cols" class:solo={!vie}>
    <section class="col travail" aria-label="Travail">
      {#if vie}<h2>Travail</h2>{/if}
      {#if dayVisible(s)}<p>{dayLine}</p>{/if}
      {#if p.pileVisible}
        <p>Assiettes sales : {Math.floor(p.pile)}</p>
        {#if p.pile > pileCap(s) * 0.7}
          <p class="sub">Au-delà de {pileCap(s)}, le chef les lave lui-même.</p>
        {/if}
      {/if}
      {#if coversVisible(s)}<p class="sub">{p.covers} couverts par jour</p>{/if}

      {#if !s.manualRetired}
        <button class="bt wash" disabled={plates <= 0 || onThePhone(s)} onclick={() => work(s)}>{washLabel}</button>
      {/if}

      {#if p.oldRate > 0}
        <h3>Lave-vaisselle</h3>
        {#if p.greasy}
          <p>Assiettes grasses. Le lave-vaisselle est à l'arrêt.</p>
          <div class="row">
            <button class="bt" onclick={() => relaunchCycle(s)}>Relancer un cycle</button>
            <button class="bt" onclick={() => shelveGreasy(s)}>Les ranger quand même</button>
          </div>
          <p class="sub">Relancer : 8 s sans assiette propre. Les ranger : aucun arrêt.</p>
        {:else if p.relaunchLeft > 0}
          <p>Le lave-vaisselle relave la fournée ({Math.ceil(p.relaunchLeft)} s).</p>
        {:else}
          <p>{rate(machineRate(s))} assiettes / s</p>
        {/if}
        {#if cycleCourtAvailable(s)}
          <div class="buy">
            <button class="bt" onclick={() => setCycleCourt(s)}>Programmer le lave-vaisselle en cycle court</button>
            <span class="price">gratuit</span>
            {#each cycleCourtEffects(s) as l}<p class="sub">{l}</p>{/each}
          </div>
        {/if}
      {/if}

      {#if nextEquipment}
        <h3>Améliorations</h3>
        <div class="buy">
          <button class="bt" disabled={!canBuyEquipment(s, nextEquipment.id)} onclick={() => buyEquipment(s, nextEquipment.id)}>{nextEquipment.cta}</button>
          <span class="price">{euros(nextEquipment.cost)}</span>
          {#each equipmentEffects(s, nextEquipment) as l}<p class="sub">{l}</p>{/each}
        </div>
      {/if}

      {#if ask || canOfferSunday(s)}
        <h3>Le chef</h3>
        {#if canOfferSunday(s)}
          <div class="buy">
            <button class="bt" onclick={() => offerSunday(s)}>{SUNDAY_OFFER.cta}</button>
            {#each askEffects(s, SUNDAY_OFFER) as l}<p class="sub">{l}</p>{/each}
          </div>
        {/if}
        {#if ask}
          <div class="buy">
            <button class="bt" onclick={() => askChef(s)}>{ask.cta}</button>
            {#each askEffects(s, ask) as l}<p class="sub">{l}</p>{/each}
          </div>
        {/if}
      {/if}

      {#if canOpenLivret(s)}
        <h3>La banque</h3>
        <div class="buy">
          <button class="bt" onclick={() => openLivret(s)}>{LIVRET_CTA}</button>
          <span class="price">gratuit</span>
          {#each livretEffects(s) as l}<p class="sub">{l}</p>{/each}
        </div>
      {/if}

      {#if canPoseGants(s)}
        <div class="buy pivot">
          <button class="bt" onclick={() => poseGants(s)}>Poser les gants</button>
          {#each poseGantsEffects(s) as l}<p class="sub">{l}</p>{/each}
        </div>
      {/if}

      {#if canAnswerAnnonce(s)}
        <div class="annonce">
          <p>{ANNONCE_TEXT}</p>
          <button class="bt" onclick={() => answerAnnonce(s)}>{ANNONCE_CTA}</button>
          {#each ANNONCE_EFFECTS as l}<p class="sub">{l}</p>{/each}
        </div>
      {/if}
    </section>

    {#if vie}
      <section class="col vie" aria-label="Ta vie">
        <h2>Ta vie</h2>
        <p class="sub">{AGE_PLONGEUR} ans</p>
        {#if s.flags.energyVisible}
          <p>Énergie : {Math.round(s.energy)} / 100</p>
        {/if}

        {#if canAnswerCall(s)}
          <div class="call">
            <p>Maman appelle.</p>
            <button class="bt" onclick={() => answerCall(s)}>Décrocher</button>
            {#each callEffects(s) as l}<p class="sub">{l}</p>{/each}
          </div>
        {:else if onThePhone(s)}
          <div class="call"><p>Tu es au téléphone avec Maman.</p></div>
        {/if}

        {#if libraryVisible(s)}
          <h3>Tes études</h3>
          {#each studiesOwned as item (item.id)}
            {@const prog = studyProgress(s, item)}
            <div class="study">
              <p>{item.name}</p>
              {#if studyDone(s, item.id)}
                <p class="sub">{item.done}</p>
              {:else}
                <p class="progress">
                  <span class="bar"><i style="width: {(prog.done / prog.total) * 100}%"></i></span>
                  <span class="sub">{prog.done} / {prog.total} {item.unit}</span>
                </p>
                <button class="bt" disabled={!canStudyStep(s, item.id)} onclick={() => studyStep(s, item.id)}>{studyStepLabel(s, item)}</button>
                {#each studyStepEffects(s, item) as l}<p class="sub">{l}</p>{/each}
              {/if}
            </div>
          {/each}
          {#if nextStudy}
            <div class="buy">
              <button class="bt" disabled={!canBuyStudy(s, nextStudy.id)} onclick={() => buyStudy(s, nextStudy.id)}>{nextStudy.cta}</button>
              <span class="price">{euros(nextStudy.cost)}</span>
              {#each studyBuyEffects(nextStudy) as l}<p class="sub">{l}</p>{/each}
            </div>
          {/if}
        {:else if p.equipment["detartrer"]}
          <p class="sub">{STUDY_TEASER}</p>
        {/if}

        {#if canLookOutWindow(s)}
          <button class="bt window" onclick={() => lookOutWindow(s)}>Regarder par la fenêtre</button>
        {/if}

        {#if s.souvenirs.length > 0}
          <h3>Souvenirs</h3>
          <ul class="souvenirs">
            {#each s.souvenirs.slice(0, 5) as m, i (i)}
              <li class:missed={m.missed}>{m.day} : {souvenirLine(m.text)}</li>
            {/each}
          </ul>
        {/if}
      </section>
    {/if}
  </div>
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
