<script lang="ts">
  import { game, resetGame, doubleMoney, reincarnate } from "./store.svelte";
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
    fireActe,
    canActe,
    ruleTheVoid,
    resolveIncident,
    canResolveIncident,
    decide,
    giveKeynote,
    canGiveKeynote,
    answerBadBuzz,
    canAnswerBadBuzz,
    holdMeeting,
    canHoldMeeting,
    buyControl,
    canBuyControl,
    controlCost,
    launchFirstProbe,
    canLaunchFirstProbe,
  } from "../engine/actions";
  import { GENERATORS, generatorAvailable } from "../engine/content/generators";
  import { UPGRADES } from "../engine/content/upgrades";
  import { JOBS, nextPromotion } from "../engine/content/career";
  import { nextBook } from "../engine/content/studies";
  import { currentHome, nextHome } from "../engine/content/homes";
  import { currentActe, VOID_LINES, ACTE_COUNTER_LABELS } from "../engine/content/power";
  import { CONTROLS } from "../engine/content/control";
  import { cosmicMilestone, COSMIC_MILESTONES, PROBE_COST } from "../engine/content/cosmos";
  import { MISSIONS } from "../engine/content/missions";
  import { DECISIONS, DECISIONS_SECTION_TITLE, type DecisionEffect } from "../engine/content/decisions";
  import { trendActive, TREND_MULT, TREND_WINDOW } from "../engine/content/audience";
  import { D, fmtMoney, fmtNumber } from "../engine/numbers";
  import { aiIncomePerSec, incomePerSec, emprisePerSec, energyRelevant } from "../engine/economy";
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
    president: "Bureau présidentiel",
    monde: "Centre de commandement",
    empereur: "Trône cosmique",
  };
  const appTitle = $derived(APP_TITLES[s.job]);
  const acte = $derived(currentActe(s.job));
  const voidLine = $derived(VOID_LINES[s.job]);
  const empriseRate = $derived(emprisePerSec(s));
  const genGroupTitle = $derived(s.flags.act3 ? "Appareil de pouvoir" : "Équipe et automatisation");
  const act2 = $derived(!!s.flags.act2 && !s.flags.act3);
  let renouncing = $state(false);

  // Acte III : compteur d'actes (« 3 alliances », « 4 lois »…) affiché à côté de l'acte courant.
  const acteCount = $derived(s.acteCounts[s.job] ?? 0);
  const acteCounterLabel = $derived(ACTE_COUNTER_LABELS[s.job]);

  // Damiers de contrôle : cibles du métier courant, révélées à mesure (possédées ou seuil atteint).
  // Une cible non possédée n'apparaît qu'une fois son seuil de révélation franchi (arrivée échelonnée).
  function damierCases(damierJob: "president" | "monde", active: boolean) {
    return CONTROLS.filter((c) => {
      if (c.job !== damierJob) return false;
      if (!active) return !!s.controls[c.id]; // damier « acquis » (grisé) : seules les cibles prises
      return s.controls[c.id] || s.money.gte(c.unlockAtMoney);
    });
  }

  // La jauge de Résistance vire du bleu acier froid au rouge éteint à mesure qu'elle monte.
  const RES_COLD = [91, 143, 176]; // #5b8fb0
  const RES_HOT = [122, 36, 32]; // #7a2420
  const resColor = $derived.by(() => {
    const t = Math.min(1, Math.max(0, s.resistance / 100));
    const c = RES_COLD.map((v, i) => Math.round(v + (RES_HOT[i] - v) * t));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  });

  // Empereur : dernier palier cosmique franchi + liste discrète des paliers déjà atteints.
  const cosmicLine = $derived(cosmicMilestone(s.probes));
  const cosmicReached = $derived(COSMIC_MILESTONES.filter((m) => s.probes.gte(m.threshold)));

  // Équipe (lead dev / CTO / fondateur) : l'effectif humain se VOIT en pastilles.
  const TEAM_CAP = 20;
  const juniors = $derived(s.generators["junior"] ?? 0);
  const seniors = $derived(s.generators["senior"] ?? 0);
  const teamSize = $derived(juniors + seniors);
  const teamDots = $derived.by(() => {
    const arr: ("sr" | "jr")[] = [];
    for (let i = 0; i < seniors; i++) arr.push("sr");
    for (let i = 0; i < juniors; i++) arr.push("jr");
    return arr.slice(0, TEAM_CAP);
  });
  const teamOverflow = $derived(Math.max(0, teamSize - TEAM_CAP));

  // Cartes de décision (CTO) : une option n'est jouable que si son coût éventuel est payable.
  function canAfford(eff: DecisionEffect): boolean {
    return eff.cost === undefined || s.money.gte(eff.cost);
  }
  function pct(mult: number): string {
    const d = Math.round((mult - 1) * 100);
    return (d >= 0 ? "+" : "") + d + " %";
  }
  // Description lisible de l'effet d'une option (pas de tiret séparateur : point médian).
  function effectText(eff: DecisionEffect): string {
    const parts: string[] = [];
    if (eff.cost !== undefined) parts.push(`Coûte ${fmtMoney(D(eff.cost))}`);
    if (eff.cash !== undefined) parts.push(`+${fmtMoney(D(eff.cash))} tout de suite`);
    if (eff.teamOutputMult !== undefined) parts.push(`${pct(eff.teamOutputMult)} de rendement d'équipe`);
    if (eff.gpuCostMult !== undefined) parts.push(`${pct(eff.gpuCostMult)} sur le coût des GPU`);
    if (eff.hireCostMult !== undefined) parts.push(`${pct(eff.hireCostMult)} sur le coût des embauches`);
    if (eff.gpuErosionMult !== undefined) parts.push(`${pct(eff.gpuErosionMult)} d'érosion par GPU`);
    if (eff.aiRateMult !== undefined) parts.push(`${pct(eff.aiRateMult)} de débit IA`);
    if (eff.incidentPeriodMult !== undefined)
      parts.push(eff.incidentPeriodMult > 1 ? "Incidents plus rares" : "Incidents plus fréquents");
    if (eff.setIncidentAutoResolve !== undefined)
      parts.push(`Auto résolus en ${eff.setIncidentAutoResolve} s`);
    return parts.join(" · ");
  }

  // --- Fil de posts (célébrité) : état d'AFFICHAGE local, aucune logique de jeu ici. ---
  const AVATARS = [
    "linear-gradient(135deg, #f6a5c0, #c2447e)",
    "linear-gradient(135deg, #a5b8f6, #5b52d6)",
    "linear-gradient(135deg, #f6cfa5, #d68a2e)",
    "linear-gradient(135deg, #a5f6d0, #2eaf8a)",
  ];
  let posts = $state<{ id: number; gain: string; trending: boolean; avatar: string }[]>([]);
  let postSeq = 0;
  function publishPost(): void {
    const before = s.followers;
    const trending = trendActive(s);
    work(s);
    const gain = s.followers.sub(before);
    posts = [
      { id: postSeq, gain: fmtNumber(gain), trending, avatar: AVATARS[postSeq % AVATARS.length] },
      ...posts,
    ].slice(0, 3);
    postSeq += 1;
  }

  // --- Sparkline du revenu : buffer d'affichage (1 point/s, 60 points), échantillonné hors moteur. ---
  let revPoints = $state<{ money: number; rev: number }[]>([]);
  $effect(() => {
    const iv = setInterval(() => {
      const st = game.state;
      revPoints.push({ money: st.money.toNumber(), rev: incomePerSec(st).mul(60).toNumber() });
      if (revPoints.length > 60) revPoints.shift();
    }, 1000);
    return () => clearInterval(iv);
  });
  function computeTrend(pts: { money: number; rev: number }[], key: "money" | "rev"): number {
    if (pts.length < 2) return 0;
    const last = pts[pts.length - 1][key];
    const prev = pts[Math.max(0, pts.length - 11)][key];
    if (last > prev * 1.0005) return 1;
    if (last < prev * 0.9995) return -1;
    return 0;
  }
  const moneyTrend = $derived(computeTrend(revPoints, "money"));
  const revTrend = $derived(computeTrend(revPoints, "rev"));
  function arrowChar(dir: number): string {
    return dir > 0 ? "▲" : dir < 0 ? "▼" : "";
  }
  const spark = $derived.by(() => {
    const vals = revPoints.map((p) => p.rev).filter((v) => Number.isFinite(v));
    if (vals.length < 2) return null;
    const w = 240;
    const h = 40;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const step = w / (vals.length - 1);
    let line = "";
    vals.forEach((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      line += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
    });
    line = line.trim();
    return { line, area: `${line} L${w} ${h} L0 ${h} Z`, w, h };
  });

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

{#snippet damier(damierJob: "president" | "monde", active: boolean)}
  <!-- Chaque cible = une case. Possédée : remplie en bleu froid, cochée, non cliquable, avec ses
       +€/s et +emprise/s. Non possédée : bouton achetable. Les cibles de répression ont un liseré. -->
  <div class="damier" class:acquired={!active}>
    {#each damierCases(damierJob, active) as c (c.id)}
      {#if s.controls[c.id]}
        <div class="case owned" class:repression={c.repression}>
          <span class="case-check" aria-hidden="true">✓</span>
          <span class="case-label">{c.label}</span>
          <span class="case-yield">+{fmtMoney(c.moneyPerSec)} / s · +{fmtNumber(c.emprisePerSec)} emprise / s</span>
        </div>
      {:else}
        <button
          class="case buyable"
          class:repression={c.repression}
          disabled={!canBuyControl(s, c.id)}
          onclick={() => buyControl(s, c.id)}
        >
          <span class="case-label">{c.label}</span>
          <span class="case-cost">{fmtMoney(controlCost(c.id))}</span>
        </button>
      {/if}
    {/each}
  </div>
{/snippet}

{#snippet resistanceGauge()}
  <!-- Jauge 0..100 : bleu acier au repos, rouge éteint à mesure que la contestation monte. -->
  <div class="resistance">
    <div class="res-head">
      <span class="res-label">Résistance</span>
      <span class="res-val">{Math.round(s.resistance)} / 100</span>
    </div>
    <div class="res-bar"><div class="res-fill" style:width="{Math.round(s.resistance)}%" style:background={resColor}></div></div>
    <p class="res-hint">L'emprise produite est freinée.</p>
  </div>
{/snippet}

{#snippet epilogue()}
  <div class="epilogue">
    {#if s.flags.ending}
      <p class="ep-title">Tu règnes sur le vide.</p>
      <p class="ep-line">L'univers t'appartient. Il est silencieux. Rien ne se passe, et plus rien n'arrivera.</p>
      <p class="ep-line dim">Sens {Math.round(s.sens)} / 100</p>
    {:else if renouncing}
      <p class="ep-title">Tu lâches tout.</p>
      <p class="ep-line">L'empire s'efface. L'Emprise retombe. Les titres se défont, un à un, jusqu'à ton nom.</p>
      <p class="ep-line">Il te reste une vie à vivre.</p>
      <button class="primary" onclick={() => reincarnate()}>Revivre</button>
    {:else}
      <p class="ep-title">Tu as tout. Il ne reste personne pour le voir.</p>
      <p class="ep-line dim">Emprise {fmtNumber(s.emprise)}. Sens {Math.round(s.sens)} / 100. Plus aucune vie autour de toi.</p>
      <div class="ep-choices">
        <button class="ghost" onclick={() => ruleTheVoid(s)}>Régner sur le vide</button>
        <button class="primary" onclick={() => (renouncing = true)}>Tout lâcher et revivre</button>
      </div>
    {/if}
  </div>
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
    {#if s.karma > 0}<p class="line muted">Karma : {s.karma}</p>{/if}
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
          <button class="action" onclick={() => becomeDeveloper(s)}>Postuler à un poste de développeur</button>
        {/if}
      </section>
    {/if}
  </main>
{:else}
  <!-- À partir du développeur : décor = logement du joueur, l'interface est un « écran » design. -->
  <div class="stage" class:act3={s.flags.act3} style:background-image={home.bg}>
    <button class="screen-toggle" onclick={() => (screenOpen = !screenOpen)}>
      {screenOpen ? "Réduire l'écran" : "Ouvrir l'écran"}
    </button>
    {#if screenOpen}
      <main class="screen" data-act={s.flags.act3 ? "3" : s.flags.act2 ? "2" : "1"} data-phase={s.job}>
        <header class="winbar">
          <span class="dot dr"></span><span class="dot dy"></span><span class="dot dg"></span>
          <span class="wintitle">{appTitle}</span>
        </header>

        {#if s.flags.epilogue}
          {@render epilogue()}
        {:else}
          <div class="dash">
          <!-- Bannières d'alerte (en haut du dash) : incident, tendance, bad buzz. -->
          {#if s.incident}
            <div class="incident-banner">
              <div class="ib-text">
                <span class="ib-title">Incident en production</span>
                <span class="ib-sub">Rendement d'équipe divisé par deux · s'éteint dans {Math.ceil(s.incident.timeLeft)} s</span>
              </div>
              <button class="ib-btn" disabled={!canResolveIncident(s)} onclick={() => resolveIncident(s)}>
                Résoudre l'incident
              </button>
            </div>
          {/if}
          {#if trendActive(s)}
            <div class="trend-banner">
              <span class="tb-title">Tendance</span>
              <span class="tb-sub">Tes posts portent ×{TREND_MULT} · encore {Math.ceil(TREND_WINDOW - s.trendTimer)} s</span>
            </div>
          {/if}
          {#if s.badBuzz}
            <div class="badbuzz-banner">
              <div class="bb-text">
                <span class="bb-title">Bad buzz</span>
                <span class="bb-sub">Les followers fuient · {Math.ceil(s.badBuzz.timeLeft)} s</span>
              </div>
              <button class="bb-btn" disabled={!canAnswerBadBuzz(s)} onclick={() => answerBadBuzz(s)}>
                Répondre à la polémique
              </button>
            </div>
          {/if}

          <div class="stats">
            {#if s.flags.moneyVisible}
              <div class="tile accent">
                <span class="tk">Argent</span>
                <span class="tv">{fmtMoney(s.money)}{#if act2 && arrowChar(moneyTrend)}<span class="arrow" class:up={moneyTrend > 0} class:down={moneyTrend < 0}>{arrowChar(moneyTrend)}</span>{/if}</span>
              </div>
            {/if}
            {#if s.flags.moneyVisible && perMinute.gt(0)}
              <div class="tile" class:wide={act2 && spark}>
                <span class="tk">Revenu</span>
                <span class="tv">{fmtMoney(perMinute)}<span class="tu"> / min</span>{#if act2 && arrowChar(revTrend)}<span class="arrow" class:up={revTrend > 0} class:down={revTrend < 0}>{arrowChar(revTrend)}</span>{/if}</span>
                {#if act2 && spark}
                  <svg class="spark" viewBox="0 0 {spark.w} {spark.h}" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="sparkgrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stop-color="var(--accent)" stop-opacity="0.35" />
                        <stop offset="1" stop-color="var(--accent)" stop-opacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={spark.area} fill="url(#sparkgrad)" />
                    <path d={spark.line} fill="none" stroke="var(--accent)" stroke-width="1.5" vector-effect="non-scaling-stroke" />
                  </svg>
                {/if}
              </div>
            {/if}
            {#if s.job === "developpeur"}
              <div class="tile">
                <span class="tk">Bugs résolus</span>
                <span class="tv">{s.bugsResolved}{#if s.missionsDone > 0}<span class="tu"> · {s.missionsDone} mission{s.missionsDone > 1 ? "s" : ""}</span>{/if}</span>
              </div>
            {/if}
            {#if s.flags.energyVisible && energyRelevant(s)}
              <div class="tile">
                <span class="tk">Énergie</span>
                <div class="bar"><div class="bar-fill" style:width="{Math.round(s.energy)}%"></div></div>
              </div>
            {/if}
            {#if s.job === "celebrite" || s.followers.gt(0)}
              <div class="tile">
                <span class="tk">{s.job === "celebrite" ? "Followers" : "On parle de toi"}</span>
                <span class="tv">{fmtNumber(s.followers)}</span>
                {#if s.job === "celebrite" && s.maxFollowers.gt(0)}
                  <span class="tu">pic {fmtNumber(s.maxFollowers)}</span>
                {/if}
              </div>
            {/if}
            {#if s.emprise.gt(0) || s.flags.act3}
              <div class="tile accent">
                <span class="tk">Emprise</span>
                <span class="tv">{fmtNumber(s.emprise)}</span>
              </div>
            {/if}
          </div>

          {#if s.flags.aiResolving}
            <p class="srcline"><span class="led"></span> L'IA résout les bugs : {fmtMoney(aiIncomePerSec(s))} / s</p>
          {/if}

          {#if empriseRate.gt(0)}
            <p class="srcline"><span class="led"></span> L'IA étend ton emprise : {fmtNumber(empriseRate)} / s</p>
          {/if}

          {#if s.flags.act3 && voidLine}
            <p class="voidline">{voidLine}</p>
          {/if}

          {#if s.flags.sensRevealed}
            <div class="sensbox">
              <span>Tu as tout.</span>
              <span class="sensval">Sens : {Math.round(s.sens)} / 100</span>
            </div>
          {/if}

          {#if s.pendingDecision && DECISIONS[s.decisionIndex]}
            {@const card = DECISIONS[s.decisionIndex]}
            <section class="decision">
              <h3 class="decision-title">{DECISIONS_SECTION_TITLE}</h3>
              <p class="decision-q">{card.title}</p>
              <div class="decision-options">
                <button class="decision-opt" disabled={!canAfford(card.optionA)} onclick={() => decide(s, "A")}>
                  <span class="do-label">{card.optionA.label}</span>
                  <span class="do-effect">{effectText(card.optionA)}</span>
                </button>
                <button class="decision-opt" disabled={!canAfford(card.optionB)} onclick={() => decide(s, "B")}>
                  <span class="do-label">{card.optionB.label}</span>
                  <span class="do-effect">{effectText(card.optionB)}</span>
                </button>
              </div>
            </section>
          {/if}

          {#if showWork}
            {#if s.job === "celebrite"}
              <div class="composer">
                <button class="primary compose-btn" onclick={publishPost}>Publier un post</button>
                {#if posts.length}
                  <div class="feed">
                    {#each posts as p (p.id)}
                      <div class="post">
                        <span class="avatar" style:background={p.avatar}></span>
                        <div class="post-body">
                          <span class="post-gain">+{p.gain} followers</span>
                          {#if p.trending}<span class="post-trend">en tendance</span>{/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {:else}
              <button class="primary" disabled={workExhausted} onclick={() => work(s)}>
                {workExhausted ? "Épuisé, repose-toi" : clickLabel}
              </button>
            {/if}
          {/if}

          {#if s.job === "politique"}
            <div class="meeting-block">
              <button class="primary meeting" disabled={!canHoldMeeting(s)} onclick={() => holdMeeting(s)}>
                {s.meetingCooldown > 0 ? `Tenir un meeting · ${Math.ceil(s.meetingCooldown)} s` : "Tenir un meeting"}
              </button>
              <p class="meeting-hint">Convertit une partie de ton audience en emprise.</p>
            </div>
          {/if}

          {#if s.job === "president" || s.job === "monde"}
            <section class="group control-stack">
              <h3>{s.job === "monde" ? "Carte du pouvoir" : "Damier des institutions"}</h3>
              {#if s.job === "monde"}
                <p class="damier-title acquired-title">Institutions · acquis</p>
                {@render damier("president", false)}
                <p class="damier-title">Continents</p>
              {/if}
              {@render damier(s.job, true)}
              {@render resistanceGauge()}
            </section>
          {/if}

          {#if s.job === "empereur"}
            <section class="group cosmos">
              <h3>Sondes von Neumann</h3>
              {#if s.probes.lte(0)}
                <div class="row">
                  <button class="buy" disabled={!canLaunchFirstProbe(s)} onclick={() => launchFirstProbe(s)}>
                    Lancer la première sonde von Neumann
                  </button>
                  <span class="price">{fmtMoney(PROBE_COST)}</span>
                </div>
              {:else}
                <div class="probe-readout">
                  <span class="probe-count">{fmtNumber(s.probes)}<span class="tu"> sondes</span></span>
                  <span class="probe-rate">+{fmtNumber(empriseRate)} emprise / s</span>
                </div>
                {#if cosmicLine}
                  <p class="voidline cosmic">{cosmicLine}</p>
                {/if}
                {#if cosmicReached.length}
                  <ul class="cosmic-log">
                    {#each cosmicReached as m (m.line)}
                      <li>{m.line}</li>
                    {/each}
                  </ul>
                {/if}
              {/if}
            </section>
          {/if}

          {#if s.mission && MISSIONS[s.mission.tier]}
            {@const def = MISSIONS[s.mission.tier]}
            <div class="mission">
              <div class="mission-head">
                <span class="mission-label">{def.label}</span>
                <span class="mission-prime">+{fmtMoney(D(def.prime))}</span>
              </div>
              <div class="bar mission-bar">
                <div class="bar-fill" style:width="{Math.min(100, Math.round((s.mission.progress / def.bugs) * 100))}%"></div>
              </div>
              <div class="mission-meta">
                <span>{s.mission.progress} / {def.bugs} bugs</span>
                <span>{Math.ceil(s.mission.timeLeft)} s</span>
              </div>
            </div>
          {/if}

          {#if s.job === "entrepreneur" && s.upgrades["leve_amorcage"]}
            <div class="keynote-block">
              <button class="primary keynote" class:glow={s.keynoteBoostLeft > 0} disabled={!canGiveKeynote(s)} onclick={() => giveKeynote(s)}>
                {s.keynoteTimer > 0 ? `Donner une keynote · ${Math.ceil(s.keynoteTimer)} s` : "Donner une keynote"}
              </button>
              {#if s.keynoteBoostLeft > 0}
                <p class="keynote-boost">La démo fait le tour des réseaux · encore {Math.ceil(s.keynoteBoostLeft)} s</p>
              {/if}
            </div>
          {/if}

          {#if teamSize > 0 && !s.flags.equipeRemplacee}
            <section class="group team">
              <h3>Équipe</h3>
              <div class="team-dots">
                {#each teamDots as d, i (i)}
                  <span class="dotm {d}"></span>
                {/each}
                {#if teamOverflow > 0}<span class="dot-more">+{teamOverflow}</span>{/if}
              </div>
            </section>
          {/if}

          {#if hasUpgrades}
            <section class="group">
              <h3>Améliorations</h3>
              {@render upgradesList()}
            </section>
          {/if}

          {#if hasGenerators}
            <section class="group">
              <h3>{genGroupTitle}</h3>
              {@render generatorsList()}
            </section>
          {/if}

          {#if canFireTeam(s)}
            <button class="primary ghost-danger" onclick={() => fireTeam(s)}>Remplacer l'équipe par l'IA</button>
          {/if}

          {#if acte}
            <section class="group">
              <h3>Actes de pouvoir</h3>
              <div class="row">
                <button class="buy" disabled={!canActe(s)} onclick={() => fireActe(s)}>{acte.label}</button>
                {#if acteCount > 0 && acteCounterLabel}<span class="count acte-count">{acteCount} {acteCounterLabel}</span>{/if}
                <span class="price">{s.acteCooldown > 0 ? `${Math.ceil(s.acteCooldown)} s` : "prêt"}</span>
              </div>
            </section>
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
              {#if s.flags.act3}
                <button class="ghost" disabled>Plus personne à retrouver.</button>
              {:else}
                <button class="ghost" onclick={() => rest(s)}>Se reposer</button>
              {/if}
            {/if}
            {#if promo && canPromote(s)}
              <button class="promote" onclick={() => promote(s)}>{promo.cta}</button>
            {/if}
          </div>

          </div>
        {/if}
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
  .stage.act3 {
    box-shadow: inset 0 0 0 100vmax rgba(9, 13, 22, 0.62);
  }

  .screen {
    --panel: #ffffff;
    --fg: #1b2330;
    --muted: #6b7686;
    --line: #e4e8ef;
    --card: #f4f6fa;
    --accent: #2f6df0;
    width: 100%;
    max-width: 680px;
    max-height: 84vh;
    overflow-y: auto;
    background: var(--panel);
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
  /* Acte III : le confort se fige en quelque chose de froid et dystopique. */
  .screen[data-act="3"] {
    --panel: #10141b;
    --fg: #c7d0db;
    --muted: #6f7a8a;
    --line: #28313f;
    --card: #19212c;
    --accent: #5b8fb0;
  }
  .screen[data-act="3"] .winbar,
  .screen[data-act="3"] .buy,
  .screen[data-act="3"] .ghost,
  .screen[data-act="3"] .primary.ghost-danger {
    background: var(--panel);
  }
  .screen[data-act="3"] .bar {
    background: #28313f;
  }
  .screen[data-act="3"] .buy:hover:not(:disabled),
  .screen[data-act="3"] .ghost:hover:not(:disabled) {
    background: #1c2735;
    border-color: var(--accent);
  }

  /* ---------- Acte III : meeting politique (conversion sobre, froide) ---------- */
  .meeting-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .meeting-hint {
    margin: 0;
    font-size: 12px;
    color: var(--muted);
    text-align: center;
  }

  /* ---------- Acte III : compteur d'actes (« 3 alliances ») ---------- */
  .acte-count {
    font-variant-numeric: tabular-nums;
  }

  /* ---------- Acte III : damiers de contrôle (la carte du pouvoir se referme) ---------- */
  .control-stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .damier-title {
    margin: 6px 0 2px;
    font-size: 12px;
    color: var(--muted);
    letter-spacing: 0.03em;
  }
  .acquired-title {
    opacity: 0.7;
  }
  .damier {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
  }
  /* Le damier « acquis » (institutions vues depuis le métier monde) : réduit et grisé. */
  .damier.acquired {
    opacity: 0.5;
    filter: grayscale(0.5);
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  .damier.acquired .case {
    padding: 7px 9px;
  }
  .damier.acquired .case-yield {
    display: none;
  }
  .case {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: left;
    border-radius: 8px;
    padding: 10px 11px;
    font-family: inherit;
    box-sizing: border-box;
  }
  /* Case libre : bouton achetable, cadre acier discret. */
  .case.buyable {
    background: var(--panel);
    border: 1px solid var(--line);
    color: var(--fg);
    cursor: pointer;
  }
  .case.buyable:hover:not(:disabled) {
    border-color: var(--accent);
    background: #1c2735;
  }
  .case.buyable:disabled {
    color: var(--muted);
    background: var(--card);
    cursor: default;
  }
  /* Case prise : remplie en bleu froid, cochée, figée (la case se referme). */
  .case.owned {
    background: linear-gradient(160deg, #1d3346, #24506e);
    border: 1px solid #3f7ba0;
    color: #d5e4ef;
    position: relative;
  }
  /* Cible de répression : liseré distinct (elle calme la Résistance). */
  .case.repression {
    border-color: #7a5a2a;
  }
  .case.owned.repression {
    border-color: #b98a3e;
    box-shadow: inset 0 0 0 1px rgba(185, 138, 62, 0.35);
  }
  .case-check {
    position: absolute;
    top: 8px;
    right: 10px;
    font-size: 13px;
    color: #7fd0a8;
  }
  .case-label {
    font-size: 13px;
    font-weight: 500;
    padding-right: 16px;
  }
  .case-cost,
  .case-yield {
    font-size: 11px;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .case.owned .case-yield {
    color: #9db8cc;
  }

  /* ---------- Acte III : jauge de Résistance (froide → rouge éteint) ---------- */
  .resistance {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 4px;
  }
  .res-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 12px;
    color: var(--muted);
  }
  .res-val {
    font-variant-numeric: tabular-nums;
  }
  .res-bar {
    height: 9px;
    border-radius: 6px;
    background: #1a222d;
    overflow: hidden;
  }
  .res-fill {
    height: 100%;
    transition: width 0.3s, background 0.3s;
  }
  .res-hint {
    margin: 0;
    font-size: 11px;
    color: var(--muted);
  }

  /* ---------- Empereur : sondes et paliers cosmiques (contemplatif) ---------- */
  .probe-readout {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 4px 0 6px;
  }
  .probe-count {
    font-size: 22px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    color: var(--accent);
  }
  .probe-rate {
    font-size: 13px;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .voidline.cosmic {
    margin-top: 2px;
  }
  .cosmic-log {
    list-style: none;
    margin: 6px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .cosmic-log li {
    font-size: 12px;
    color: var(--muted);
    opacity: 0.7;
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

  .voidline {
    margin: 0;
    font-size: 13px;
    font-style: italic;
    color: var(--muted);
  }

  .epilogue {
    padding: 26px 20px 30px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    text-align: center;
  }
  .ep-title {
    margin: 0;
    font-size: 19px;
    font-weight: 500;
  }
  .ep-line {
    margin: 0;
    font-size: 15px;
    line-height: 1.7;
  }
  .ep-line.dim {
    color: var(--muted);
    font-size: 13px;
  }
  .ep-choices {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 8px;
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

  /* ---------- Développeur : carte de mission + tuile bugs ---------- */
  .mission {
    border: 1px solid var(--accent);
    border-radius: 12px;
    padding: 11px 13px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: color-mix(in srgb, var(--accent) 6%, var(--panel));
  }
  .mission-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
  }
  .mission-label {
    font-size: 14px;
    font-weight: 500;
  }
  .mission-prime {
    font-size: 13px;
    font-weight: 500;
    color: var(--accent);
  }
  .mission-bar {
    margin-top: 0;
  }
  .mission-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--muted);
  }

  /* ---------- Bannière d'incident (lead dev / CTO) : casse le calme ---------- */
  .incident-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    background: #fbe9e7;
    border: 1.5px solid #e0524a;
    box-shadow: 0 0 0 0 rgba(224, 82, 74, 0.5);
    animation: incident-pulse 2s ease-in-out infinite;
  }
  @keyframes incident-pulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(224, 82, 74, 0);
    }
    50% {
      box-shadow: 0 0 0 4px rgba(224, 82, 74, 0.18);
    }
  }
  .ib-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ib-title {
    font-size: 14px;
    font-weight: 600;
    color: #b23029;
  }
  .ib-sub {
    font-size: 12px;
    color: #9a5651;
  }
  .ib-btn {
    flex: none;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    color: #ffffff;
    background: #d84a41;
    border: none;
    border-radius: 8px;
    padding: 9px 13px;
    cursor: pointer;
  }
  .ib-btn:hover:not(:disabled) {
    background: #c33d35;
  }
  .ib-btn:disabled {
    background: #edb9b5;
    cursor: default;
  }

  /* ---------- Cartes de décision (CTO) : première mise en scène riche ---------- */
  .decision {
    border: 1.5px solid var(--accent);
    border-radius: 14px;
    padding: 13px 15px 15px;
    background: color-mix(in srgb, var(--accent) 5%, var(--panel));
    box-shadow: 0 6px 22px color-mix(in srgb, var(--accent) 20%, transparent);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .decision-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }
  .decision-q {
    margin: 2px 0 10px;
    font-size: 15px;
    font-weight: 500;
  }
  .decision-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .decision-opt {
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: left;
    font-family: inherit;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 11px 12px;
    cursor: pointer;
    transition: border-color 0.15s, transform 0.05s;
  }
  .decision-opt:hover:not(:disabled) {
    border-color: var(--accent);
    transform: translateY(-1px);
  }
  .decision-opt:disabled {
    opacity: 0.55;
    cursor: default;
  }
  .do-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--fg);
  }
  .do-effect {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.45;
  }
  @media (max-width: 460px) {
    .decision-options {
      grid-template-columns: 1fr;
    }
  }

  /* ---------- Panneau Équipe : l'effectif en pastilles ---------- */
  .team-dots {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 4px 0 6px;
  }
  .dotm {
    display: inline-block;
    border-radius: 50%;
    background: var(--accent);
  }
  .dotm.jr {
    width: 11px;
    height: 11px;
    opacity: 0.55;
  }
  .dotm.sr {
    width: 15px;
    height: 15px;
    opacity: 1;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent);
  }
  .dot-more {
    font-size: 12px;
    color: var(--muted);
    margin-left: 2px;
  }

  /* ---------- KPI : flèches de tendance + sparkline (Acte II) ---------- */
  .arrow {
    font-size: 11px;
    margin-left: 6px;
    vertical-align: middle;
    color: var(--muted);
  }
  .arrow.up {
    color: #2e9d68;
  }
  .arrow.down {
    color: #d0664a;
  }
  .tile.wide {
    grid-column: 1 / -1;
  }
  .spark {
    width: 100%;
    height: 40px;
    margin-top: 6px;
    display: block;
  }

  /* ---------- Keynote (fondateur) : halo pendant le boost ---------- */
  .keynote-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .keynote.glow {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent),
      0 8px 26px color-mix(in srgb, var(--accent) 40%, transparent);
    animation: keynote-glow 1.8s ease-in-out infinite;
  }
  @keyframes keynote-glow {
    0%,
    100% {
      filter: brightness(1);
    }
    50% {
      filter: brightness(1.12);
    }
  }
  .keynote-boost {
    margin: 0;
    font-size: 12px;
    color: var(--accent);
    text-align: center;
  }

  /* ---------- Bannière de tendance (célébrité) : chaleureuse, pulsante ---------- */
  .trend-banner {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 11px 14px;
    border-radius: 12px;
    color: #ffffff;
    background: linear-gradient(120deg, #ff8f6b, #e0559b 55%, #a24fd6);
    box-shadow: 0 8px 24px rgba(224, 85, 155, 0.35);
    animation: trend-pulse 1.6s ease-in-out infinite;
  }
  @keyframes trend-pulse {
    0%,
    100% {
      transform: scale(1);
      box-shadow: 0 8px 24px rgba(224, 85, 155, 0.3);
    }
    50% {
      transform: scale(1.012);
      box-shadow: 0 10px 30px rgba(224, 85, 155, 0.5);
    }
  }
  .tb-title {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .tb-sub {
    font-size: 12px;
    opacity: 0.92;
  }

  /* ---------- Bandeau bad buzz (célébrité) : rouge sombre, contraste ---------- */
  .badbuzz-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    color: #f6dedb;
    background: linear-gradient(120deg, #4a1512, #6d1a15);
    border: 1px solid #8a2a22;
  }
  .bb-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .bb-title {
    font-size: 14px;
    font-weight: 700;
    color: #ffb4ab;
  }
  .bb-sub {
    font-size: 12px;
    opacity: 0.85;
  }
  .bb-btn {
    flex: none;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    color: #4a1512;
    background: #f0c9c4;
    border: none;
    border-radius: 8px;
    padding: 9px 13px;
    cursor: pointer;
  }
  .bb-btn:hover:not(:disabled) {
    background: #ffffff;
  }
  .bb-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  /* ---------- Composeur + fil de posts (célébrité) ---------- */
  .composer {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .compose-btn {
    padding: 16px;
    font-size: 16px;
    border-radius: 12px;
  }
  .feed {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .post {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--card);
    border: 1px solid var(--line);
  }
  .avatar {
    flex: none;
    width: 34px;
    height: 34px;
    border-radius: 50%;
  }
  .post-body {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .post-gain {
    font-size: 14px;
    font-weight: 500;
  }
  .post-trend {
    font-size: 11px;
    font-weight: 600;
    color: #ffffff;
    background: linear-gradient(120deg, #ff8f6b, #e0559b);
    border-radius: 999px;
    padding: 2px 8px;
  }

  /* ---------- Acte II (fondateur) : le panneau fleurit, chaud et riche ---------- */
  .screen[data-act="2"] {
    --panel: #fffdf8;
    --fg: #241d12;
    --muted: #8a7a5f;
    --line: #efe4cf;
    --card: #fbf3e4;
    --accent: #c0842f;
    border-radius: 20px;
    box-shadow: 0 24px 72px rgba(70, 48, 12, 0.42);
  }
  .screen[data-act="2"] .winbar {
    background: #fffdf8;
    border-radius: 20px 20px 0 0;
  }
  .screen[data-act="2"] .tile {
    box-shadow: inset 0 0 0 1px rgba(192, 132, 47, 0.06);
  }
  .screen[data-act="2"] .tile.accent {
    background: linear-gradient(135deg, #fbe7c3, #f6d7a6);
  }
  .screen[data-act="2"] .primary {
    background: linear-gradient(135deg, #cd942f, #b06f1e);
    box-shadow: 0 6px 18px rgba(176, 111, 30, 0.32);
  }
  .screen[data-act="2"] .bar {
    background: #ecdcbf;
  }

  /* ---------- Célébrité : sommet de chaleur visuelle (rose / violet) ---------- */
  .screen[data-phase="celebrite"] {
    --panel: #fffafd;
    --fg: #2a1522;
    --muted: #9a7288;
    --line: #f2dfe9;
    --card: #fdf1f7;
    --accent: #d24d8f;
  }
  .screen[data-phase="celebrite"] .winbar {
    background: #fffafd;
  }
  .screen[data-phase="celebrite"] .tile.accent {
    background: linear-gradient(135deg, #f9d5e6, #e9b6dd);
  }
  .screen[data-phase="celebrite"] .primary {
    background: linear-gradient(135deg, #e0559b, #a24fd6);
    box-shadow: 0 6px 18px rgba(200, 80, 155, 0.32);
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
