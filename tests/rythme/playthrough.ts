// Mesure du rythme du chapitre plongeur : un joueur glouton simulé, qui clique à `cps`, achète tout
// dès que possible, propose tout, décroche toujours, lit dès qu'il peut. Sert aux tests (tests/plonge.test.ts)
// et à la frise imprimée en une commande (tests/rythme/frise.ts).
import { createInitialState } from "../../src/engine/state";
import { tick } from "../../src/engine/loop";
import { work, poseGants } from "../../src/engine/actions";
import { EQUIPMENT, LIBRARY, MEAL_ENERGY, REVEALS } from "../../src/engine/content/plonge";
import {
  canBuyEquipment,
  buyEquipment,
  canOpenLivret,
  openLivret,
  canAskChef,
  askChef,
  canOfferSunday,
  offerSunday,
  cycleCourtAvailable,
  setCycleCourt,
  shelveGreasy,
  canAnswerCall,
  answerCall,
  canPoseGants,
  canBuyStudy,
  buyStudy,
  canStudyStep,
  studyStep,
  canEat,
  eat,
  canAnswerAnnonce,
  answerAnnonce,
  isRevealed,
} from "../../src/engine/plonge";
import type { GameState } from "../../src/engine/state";

export interface PlaythroughOptions {
  afk?: boolean; // ne clique plus une fois le vieux lave-vaisselle réparé
  refuse?: boolean; // refuse le cycle court
  onStep?: (s: GameState, t: number) => void; // appelé à chaque pas, avant les actions du joueur
}

export interface Playthrough {
  secs: number; // durée du chapitre (jusqu'à l'annonce)
  reveals: [string, number][]; // frise : chaque nouveauté et l'instant où elle paraît, triées
  maxGap: number; // plus grand écart entre deux nouveautés consécutives de la frise
  dead: number; // temps mort total (fenêtres de 10 s où le clic ne sert presque à rien et rien ne s'achète)
  deadMax: number; // plus long temps mort d'affilée
}

/** Ce que le joueur voit paraître : le premier clic (l'argent), puis chaque ligne de la table des nouveautés. */
function seenChecks(s: GameState): Record<string, () => boolean> {
  const checks: Record<string, () => boolean> = { argent: () => s.totalClicks > 0 };
  for (const r of REVEALS) checks[r.id] = () => isRevealed(s, r.id);
  return checks;
}

export function playthrough(cps: number, opts: PlaythroughOptions = {}): Playthrough {
  const s = createInitialState(0);
  const dt = 0.05;
  let clickAcc = 0;
  let t = 0;
  const reveals: [string, number][] = [];
  const seen = seenChecks(s);
  // Temps mort : par fenêtre de 10 s avant les gants posés, le clic lave moins de 40 % de ce qu'il pourrait
  // et rien ne s'achète ni ne se demande.
  let dead = 0;
  let deadRun = 0;
  let deadMax = 0;
  let winClock = 0;
  let winWashed = 0;
  let winClicks = 0;
  let winActs = 0;
  while (t < 3600 && s.job === "plongeur") {
    for (const [k, f] of Object.entries(seen)) if (!reveals.some((r) => r[0] === k) && f()) reveals.push([k, t]);
    opts.onStep?.(s, t);
    const acts0 = Object.keys(s.plonge.equipment).length + s.plonge.asksDone;
    const w0 = s.plonge.washed;
    const clicking = !(opts.afk && s.plonge.oldRate > 0);
    clickAcc += clicking ? cps * dt : 0;
    while (clickAcc >= 1) {
      work(s);
      clickAcc -= 1;
    }
    for (const e of EQUIPMENT) if (canBuyEquipment(s, e.id)) buyEquipment(s, e.id);
    if (canOpenLivret(s)) openLivret(s);
    if (canAskChef(s)) askChef(s);
    if (canOfferSunday(s)) offerSunday(s);
    if (!opts.refuse && cycleCourtAvailable(s)) setCycleCourt(s);
    if (s.plonge.greasy) shelveGreasy(s);
    if (canAnswerCall(s)) answerCall(s);
    if (canPoseGants(s)) poseGants(s);
    for (const l of LIBRARY) {
      if (canBuyStudy(s, l.id)) buyStudy(s, l.id);
      if (canStudyStep(s, l.id)) studyStep(s, l.id);
    }
    if (canEat(s) && s.energy <= 100 - MEAL_ENERGY) eat(s);
    if (canAnswerAnnonce(s)) answerAnnonce(s);
    const clicksNow = s.dishesPerClick;
    const washedByHand = s.plonge.washed - w0;
    tick(s, dt);
    t += dt;
    if (!s.manualRetired) {
      winClock += dt;
      winWashed += Math.max(0, washedByHand);
      winClicks += (clicking ? cps * dt : 0) * clicksNow;
      winActs += Object.keys(s.plonge.equipment).length + s.plonge.asksDone - acts0;
      if (winClock >= 10) {
        const isDead = winClicks > 0 && winWashed < 0.4 * winClicks && winActs === 0;
        if (isDead) {
          dead += winClock;
          deadRun += winClock;
          deadMax = Math.max(deadMax, deadRun);
        } else deadRun = 0;
        winClock = winWashed = winClicks = winActs = 0;
      }
    }
  }
  reveals.push(["annonce", t]);
  reveals.sort((a, b) => a[1] - b[1]);
  let maxGap = 0;
  for (let i = 1; i < reveals.length; i++) maxGap = Math.max(maxGap, reveals[i][1] - reveals[i - 1][1]);
  return { secs: t, maxGap, reveals, dead, deadMax };
}

/** Les parties de référence : 2, 4 et 6 clics/s, en AFK après la réparation, et en refusant le cycle court. */
export const SCENARIOS: { name: string; cps: number; opts?: PlaythroughOptions }[] = [
  { name: "2 clics/s", cps: 2 },
  { name: "4 clics/s", cps: 4 },
  { name: "6 clics/s", cps: 6 },
  { name: "4 clics/s, AFK après la réparation", cps: 4, opts: { afk: true } },
  { name: "4 clics/s, refuse le cycle court", cps: 4, opts: { refuse: true } },
];
