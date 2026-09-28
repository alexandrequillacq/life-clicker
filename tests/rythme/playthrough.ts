// Mesure du rythme du chapitre plongeur : un joueur glouton simulé, qui clique à `cps`, achète tout
// dès que possible, propose tout, décroche toujours, lit dès qu'il peut. Sert aux tests (tests/plonge.test.ts)
// et à la frise imprimée en une commande (tests/rythme/frise.ts).
import { createInitialState } from "../../src/engine/state";
import { tick } from "../../src/engine/loop";
import { work, poseGants } from "../../src/engine/actions";
import { EQUIPMENT, CONCESSIONS, LIBRARY, MEAL_ENERGY, REVEALS, REVEAL_BY_ID } from "../../src/engine/content/plonge";
import {
  canBuyEquipment,
  buyEquipment,
  canOpenLivret,
  openLivret,
  canAskChef,
  askChef,
  canOfferSunday,
  offerSunday,
  concessionVisible,
  takeConcession,
  openToday,
  canAnswerCall,
  answerCall,
  canPoseGants,
  canBuyStudy,
  studyBuyVisible,
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
  refuse?: boolean; // refuse les concessions (laver moins bien pour aller plus vite)
  onStep?: (s: GameState, t: number) => void; // appelé à chaque pas, avant les actions du joueur
}

export interface Playthrough {
  secs: number; // durée du chapitre (jusqu'à l'annonce)
  reveals: [string, number][]; // frise : chaque nouveauté et l'instant où elle paraît, triées
  purchases: [string, number][]; // chaque achat d'équipement et son instant (le bouton s'est dégrisé juste avant)
  maxGap: number; // plus grand écart entre deux nouveautés consécutives de la frise
  dead: number; // temps mort total (fenêtres de 10 s où le clic ne sert presque à rien et rien ne s'achète)
  deadMax: number; // plus long temps mort d'affilée
  emptyShare: number; // part du temps à la main, jours ouverts, où la pile est vide (le clic ne sert à rien)
  overflowShare: number; // part du même temps où la pile déborde (le chef lave à ta place)
}

/** Ce que le joueur voit paraître : le premier clic (l'argent), puis chaque ligne de la table des nouveautés, et chaque étude proposée. */
function seenChecks(s: GameState): Record<string, () => boolean> {
  const checks: Record<string, () => boolean> = { argent: () => s.totalClicks > 0 };
  for (const r of REVEALS) checks[r.id] = () => isRevealed(s, r.id);
  for (const l of LIBRARY) checks[l.id] = () => l.id in s.plonge.library || studyBuyVisible(s, l.id); // chaque nouveau livre ou cours proposé
  return checks;
}

export function playthrough(cps: number, opts: PlaythroughOptions = {}): Playthrough {
  const s = createInitialState(0);
  const dt = 0.05;
  let clickAcc = 0;
  let t = 0;
  const reveals: [string, number][] = [];
  const purchases: [string, number][] = [];
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
  let manualOpen = 0;
  let manualEmpty = 0;
  let manualOverflow = 0;
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
    for (const e of EQUIPMENT) if (canBuyEquipment(s, e.id) && buyEquipment(s, e.id)) purchases.push([e.id, t]);
    if (canOpenLivret(s)) openLivret(s);
    if (canAskChef(s)) askChef(s);
    if (canOfferSunday(s)) offerSunday(s);
    if (!opts.refuse) for (const c of CONCESSIONS) if (concessionVisible(s, c.id)) takeConcession(s, c.id);
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
    const overflow0 = s.plonge.overflow;
    tick(s, dt);
    t += dt;
    if (!s.manualRetired) {
      if (openToday(s) && s.plonge.callTalk <= 0) {
        manualOpen += dt;
        if (s.plonge.pile < 1) manualEmpty += dt;
        if (s.plonge.overflow > overflow0) manualOverflow += dt;
      }
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
  const emptyShare = manualEmpty / Math.max(1, manualOpen);
  const overflowShare = manualOverflow / Math.max(1, manualOpen);
  return { secs: t, maxGap, reveals, purchases, dead, deadMax, emptyShare, overflowShare };
}

/**
 * Ce qui paraît de soi-même, sans être la conséquence immédiate d'un clic d'achat : les nouveautés du jeu,
 * et les offres qui attendent une heure ou un délai. Deux d'entre elles ne devraient jamais tomber dans la même demi-minute.
 */
export function showsByItself(id: string): boolean {
  const r = REVEAL_BY_ID[id];
  if (!r) return false;
  if (r.kind === "jeu") return true;
  return r.kind === "offre" && (r.at !== undefined || r.earned !== undefined || Object.values(r.after ?? {}).some((d) => d > 0));
}

/** Les parties de référence : 2, 4 et 6 clics/s, en AFK après la réparation, et en refusant le cycle court. */
export const SCENARIOS: { name: string; cps: number; opts?: PlaythroughOptions }[] = [
  { name: "2 clics/s", cps: 2 },
  { name: "4 clics/s", cps: 4 },
  { name: "6 clics/s", cps: 6 },
  { name: "4 clics/s, AFK après la réparation", cps: 4, opts: { afk: true } },
  { name: "4 clics/s, refuse les concessions", cps: 4, opts: { refuse: true } },
];
