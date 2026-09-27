import { D, type Decimal } from "./numbers";
import { ENERGY_MAX, type GameState } from "./state";
import {
  DAY_SECS,
  PEAK_SECS,
  PEAK_SHARE,
  PLATES_PER_COVER,
  PILE_BASE_CAP,
  DAY_NAMES,
  SUNDAY,
  HAND_UNLOCK_PLATES,
  HAND_RATE,
  BANK_UNLOCK_EARNED,
  CYCLE_COURT_MULT,
  LOAD_SECS,
  GREASY_EVERY,
  RELAUNCH_SECS,
  ENERGY_REGEN,
  CALL_RING_SECS,
  CALL_TALK_SECS,
  WINDOW_IDLE_SECS,
  ASK_EMPTY_SECS,
  EQUIPMENT_BY_ID,
  ASKS,
  LIBRARY,
  LIBRARY_BY_ID,
  WINDOW_LINES,
  WINDOW_LINES_HOME,
  CALL_SOUVENIR,
  CALL_MISSED,
  type AskDef,
  type StudyItemDef,
  type EquipmentDef,
} from "./content/plonge";

// Moteur du chapitre 1 (plongeur). Pur et déterministe : le restaurant salit des assiettes au
// rythme de ses couverts, on lave ce qui arrive (jamais plus), les machines ne se fatiguent pas,
// les mains si. Automatiser son travail libère du temps et de l'énergie pour sa vie (la bibliothèque).

const fmtRate = (n: number): string => (Math.round(n * 10) / 10).toString().replace(".", ",");

// --- Calendrier ---

export function dayIndex(s: GameState): number {
  return Math.floor(s.plonge.day / DAY_SECS);
}
function dayOfWeek(s: GameState): number {
  return dayIndex(s) % 7;
}
export function dayName(s: GameState): string {
  return DAY_NAMES[dayOfWeek(s)];
}
function timeInDay(s: GameState): number {
  return s.plonge.day - dayIndex(s) * DAY_SECS;
}
export function openToday(s: GameState): boolean {
  return dayOfWeek(s) !== SUNDAY || s.plonge.sundayOpen;
}
/** Le coup de feu de midi : les premières secondes de chaque jour ouvert. */
export function isPeak(s: GameState): boolean {
  return openToday(s) && timeInDay(s) < PEAK_SECS;
}
export function pileCap(s: GameState): number {
  return PILE_BASE_CAP + s.plonge.covers;
}
/** Assiettes sales/s qui arrivent en ce moment. */
export function arrivalRate(s: GameState): number {
  if (!openToday(s)) return 0;
  const plates = s.plonge.covers * PLATES_PER_COVER;
  return isPeak(s) ? (plates * PEAK_SHARE) / PEAK_SECS : (plates * (1 - PEAK_SHARE)) / (DAY_SECS - PEAK_SECS);
}
/** Moyenne d'arrivée sur une semaine (hors-ligne). */
function weeklyArrivalRate(s: GameState): number {
  const open = s.plonge.sundayOpen ? 7 : 6;
  return ((s.plonge.covers * PLATES_PER_COVER) / DAY_SECS) * (open / 7);
}

// --- Capacités ---

function oldMachineRate(s: GameState): number {
  return s.plonge.oldRate * s.plonge.oldMult;
}
/** Débit nominal des machines (assiettes/s), cycle court compris. */
export function machineRate(s: GameState): number {
  const base = oldMachineRate(s) + s.plonge.proRate;
  return s.plonge.cycleCourt ? base * CYCLE_COURT_MULT : base;
}
function machineRunning(s: GameState): boolean {
  return !s.plonge.greasy && s.plonge.relaunchLeft <= 0;
}
function handsBusy(s: GameState): boolean {
  return s.manualRetired || s.plonge.callTalk > 0;
}
/** Débit des mains en continu, modulé par l'énergie (la fatigue ne touche que les mains). */
export function handRateNow(s: GameState): number {
  if (!s.handWashing || handsBusy(s)) return 0;
  return s.handRate * (Math.max(0, s.energy) / ENERGY_MAX);
}

// --- Argent et gains ---

function pay(s: GameState, plates: number): void {
  if (plates <= 0) return;
  const euros = plates * s.valuePerDish.toNumber();
  s.money = s.money.add(euros);
  s.plonge.washed += plates;
  s.plonge.earned += euros;
  s.plonge.gainsAcc += euros;
}
/** Gains réels des 60 dernières secondes (ce que montre la montre), clic compris. */
export function gainsPerMinute(s: GameState): number {
  return s.plonge.gains.reduce((a, b) => a + b, 0);
}
/** Avant la banque, l'argent ne se compte pas : il se sent dans la poche. */
export function pocketLabel(s: GameState): string {
  const m = s.money.toNumber();
  if (m < 1) {
    const coins = Math.round(m / 0.05);
    return `${coins} pièce${coins > 1 ? "s" : ""} de 5 centimes`;
  }
  return `environ ${Math.round(m)} € en pièces`;
}
export const BANK_EFFECTS = ["Ton argent au centime près"];
export function canOpenBank(s: GameState): boolean {
  return s.job === "plongeur" && !s.plonge.bank && s.plonge.earned >= BANK_UNLOCK_EARNED;
}
export function openBank(s: GameState): boolean {
  if (!canOpenBank(s)) return false;
  s.plonge.bank = true;
  s.plonge.chef = "banque";
  markAction(s);
  return true;
}

/** Toute action du joueur remet à zéro le compteur d'inactivité (la fenêtre ne s'offre qu'au repos). */
function markAction(s: GameState): void {
  s.plonge.idle = 0;
}

// --- Le clic ---

/** Assiettes que le prochain clic lavera (jamais plus que la pile). */
export function clickPlates(s: GameState): number {
  return Math.min(Math.floor(s.plonge.pile), s.dishesPerClick);
}
/** Laver à la main : sans énergie (effort ponctuel), limité par la pile, impossible au téléphone. */
export function washClick(s: GameState): boolean {
  if (handsBusy(s)) return false;
  s.totalClicks += 1;
  markAction(s);
  const n = clickPlates(s);
  if (n <= 0) return false;
  s.plonge.pile -= n;
  pay(s, n);
  return true;
}

// --- Équipement ---

export function equipmentVisible(s: GameState, def: EquipmentDef): boolean {
  if (s.job !== "plongeur" || s.plonge.equipment[def.id]) return false;
  return !def.requires || !!s.plonge.equipment[def.requires];
}
export function canBuyEquipment(s: GameState, id: string): boolean {
  const def = EQUIPMENT_BY_ID[id];
  return !!def && equipmentVisible(s, def) && s.money.gte(def.cost);
}
export function buyEquipment(s: GameState, id: string): boolean {
  if (!canBuyEquipment(s, id)) return false;
  const def = EQUIPMENT_BY_ID[id];
  s.money = s.money.sub(def.cost);
  s.plonge.equipment[id] = true;
  if (def.dishesPerClick !== undefined) s.dishesPerClick = def.dishesPerClick;
  if (def.handRate !== undefined) s.handRate = def.handRate;
  if (def.fatigue !== undefined) s.plonge.fatigue = def.fatigue;
  if (def.oldRate !== undefined) s.plonge.oldRate = def.oldRate;
  if (def.oldMult !== undefined) s.plonge.oldMult *= def.oldMult;
  if (def.proRate !== undefined) s.plonge.proRate = def.proRate;
  if (def.watch) s.plonge.watch = true;
  if (def.chef) s.plonge.chef = def.chef;
  markAction(s);
  return true;
}
/** Sous-titres chiffrés : la statistique qui change avec cet achat (règle dure : toujours affichée). */
export function equipmentEffects(s: GameState, def: EquipmentDef): string[] {
  const out: string[] = [];
  if (def.dishesPerClick !== undefined) out.push(`Par clic : ${s.dishesPerClick} → ${def.dishesPerClick} assiettes`);
  if (def.fatigue !== undefined) {
    const rate = s.handWashing ? s.handRate : HAND_RATE;
    out.push(`Énergie dépensée par tes mains : ${fmtRate(rate * s.plonge.fatigue)} → ${fmtRate(rate * def.fatigue)} par seconde`);
  }
  if (def.watch) out.push("Affiche ce que tu gagnes en une minute");
  const cc = s.plonge.cycleCourt ? CYCLE_COURT_MULT : 1;
  if (def.oldRate !== undefined) out.push(`Vieux lave-vaisselle : 0 → ${fmtRate(def.oldRate * cc)} assiettes / s. Il ne se fatigue pas.`);
  if (def.oldMult !== undefined) {
    const now = oldMachineRate(s) * cc;
    out.push(`Vieux lave-vaisselle : ${fmtRate(now)} → ${fmtRate(now * def.oldMult)} assiettes / s`);
  }
  if (def.proRate !== undefined) {
    const now = machineRate(s);
    out.push(`Lave-vaisselle : ${fmtRate(now)} → ${fmtRate(now + def.proRate * cc)} assiettes / s`);
  }
  if (def.note) out.push(def.note);
  return out;
}

// --- Le compromis : le cycle court ---

export function cycleCourtAvailable(s: GameState): boolean {
  return s.job === "plongeur" && !s.plonge.cycleCourt && !!s.plonge.equipment["joint"];
}
export function cycleCourtEffects(s: GameState): string[] {
  const now = machineRate(s);
  return [`Lave-vaisselle : ${fmtRate(now)} → ${fmtRate(now * CYCLE_COURT_MULT)} assiettes / s`, "Certaines assiettes ressortent grasses."];
}
export function setCycleCourt(s: GameState): boolean {
  if (!cycleCourtAvailable(s)) return false;
  s.plonge.cycleCourt = true;
  markAction(s);
  return true;
}
/** Relancer un cycle : on relave, la machine ne sort rien pendant RELAUNCH_SECS. */
export function relaunchCycle(s: GameState): boolean {
  if (!s.plonge.greasy) return false;
  s.plonge.greasy = false;
  s.plonge.relaunchLeft = RELAUNCH_SECS;
  markAction(s);
  return true;
}
/** Les ranger quand même : rien de perdu pour toi. Le client paiera au service suivant. */
export function shelveGreasy(s: GameState): boolean {
  if (!s.plonge.greasy) return false;
  s.plonge.greasy = false;
  s.plonge.shelved += 1;
  s.plonge.complaint = true;
  markAction(s);
  return true;
}

// --- Les demandes au chef ---

export function currentAsk(s: GameState): AskDef | null {
  return ASKS[s.plonge.asksDone] ?? null;
}
/** Le chef veut bien grandir si ta pile est restée vide 12 s aujourd'hui (tu suis), une fois par jour. */
export function canAskChef(s: GameState): boolean {
  return (
    s.job === "plongeur" &&
    currentAsk(s) !== null &&
    s.plonge.emptyToday >= ASK_EMPTY_SECS &&
    s.plonge.lastAskDay < dayIndex(s)
  );
}
export function askEffects(s: GameState, def: AskDef): string[] {
  const out: string[] = [];
  if (def.covers) out.push(`Couverts par jour : ${s.plonge.covers} → ${s.plonge.covers + def.covers}`);
  if (s.plonge.asksDone === 0) out.push(`1 couvert = ${PLATES_PER_COVER} assiettes sales`);
  if (def.sunday) out.push("Jours ouverts par semaine : 6 → 7");
  if (def.note) out.push(def.note);
  return out;
}
export function askChef(s: GameState): boolean {
  if (!canAskChef(s)) return false;
  const def = currentAsk(s)!;
  if (def.covers) s.plonge.covers += def.covers;
  if (def.sunday) s.plonge.sundayOpen = true;
  if (def.chef) s.plonge.chef = def.chef;
  s.plonge.asksDone += 1;
  s.plonge.lastAskDay = dayIndex(s);
  markAction(s);
  return true;
}

// --- La vie perso ---

function remember(s: GameState, kind: "lien" | "contemplation", text: string, missed: boolean): void {
  s.souvenirs.unshift({ day: dayName(s), kind, text, missed });
  s.vieVecueTicks += missed ? 0 : 1;
  if (!missed) s.secsSinceLife = 0;
}
export function canAnswerCall(s: GameState): boolean {
  return s.plonge.callRing > 0;
}
export function callEffects(s: GameState): string[] {
  const out = [`${CALL_TALK_SECS} s au téléphone`];
  if (openToday(s) && !s.manualRetired) out.push("Tes mains s'arrêtent en plein service.");
  return out;
}
/** Décrocher : les mains (et les études) s'arrêtent le temps de l'appel. */
export function answerCall(s: GameState): boolean {
  if (!canAnswerCall(s)) return false;
  s.plonge.callRing = 0;
  s.plonge.callTalk = CALL_TALK_SECS;
  return true;
}
export function onThePhone(s: GameState): boolean {
  return s.plonge.callTalk > 0;
}
export function canLookOutWindow(s: GameState): boolean {
  return s.job === "plongeur" && s.plonge.idle >= WINDOW_IDLE_SECS && s.plonge.windowDay !== dayIndex(s);
}
export function lookOutWindow(s: GameState): boolean {
  if (!canLookOutWindow(s)) return false;
  s.plonge.windowDay = dayIndex(s);
  const lines = s.manualRetired ? WINDOW_LINES_HOME : WINDOW_LINES;
  remember(s, "contemplation", lines[s.plonge.windowCount % lines.length], false);
  s.plonge.windowCount += 1;
  markAction(s);
  return true;
}

// --- Poser les gants, la bibliothèque, l'annonce ---

export function canPoseGants(s: GameState): boolean {
  return s.job === "plongeur" && !s.manualRetired && !!s.plonge.equipment["pro"];
}
export function poseGantsEffects(s: GameState): string[] {
  const avg = (s.plonge.covers * PLATES_PER_COVER) / DAY_SECS;
  return [
    `Tu arrêtes de laver. Les lave-vaisselle suivent seuls : ${fmtRate(machineRate(s))} assiettes / s pour ${fmtRate(avg)} de vaisselle en moyenne.`,
    "Nouveau : tes études.",
  ];
}
/** Poser les gants : plus de travail manuel, place au temps libre. */
export function retireHands(s: GameState): void {
  s.manualRetired = true;
  s.handWashing = false;
  s.plonge.chef = "gants_poses";
  markAction(s);
}

export function libraryVisible(s: GameState): boolean {
  return s.job === "plongeur" && s.manualRetired;
}
function studyIndex(id: string): number {
  return LIBRARY.findIndex((l) => l.id === id);
}
export function studyDone(s: GameState, id: string): boolean {
  const def = LIBRARY_BY_ID[id];
  return !!def && (s.plonge.library[id] ?? 0) >= def.steps;
}
/** Les études s'achètent dans l'ordre, une fois la précédente achetée. */
export function studyBuyVisible(s: GameState, id: string): boolean {
  if (!libraryVisible(s) || id in s.plonge.library) return false;
  const def = LIBRARY_BY_ID[id];
  if (def.requiresDone && !studyDone(s, def.requiresDone)) return false;
  const i = studyIndex(id);
  return i === 0 || LIBRARY[i - 1].id in s.plonge.library;
}
export function canBuyStudy(s: GameState, id: string): boolean {
  const def = LIBRARY_BY_ID[id];
  return !!def && studyBuyVisible(s, id) && s.money.gte(def.cost);
}
export function buyStudy(s: GameState, id: string): boolean {
  if (!canBuyStudy(s, id)) return false;
  s.money = s.money.sub(LIBRARY_BY_ID[id].cost);
  s.plonge.library[id] = 0;
  return true;
}
export function canStudyStep(s: GameState, id: string): boolean {
  const def = LIBRARY_BY_ID[id];
  return (
    !!def && libraryVisible(s) && id in s.plonge.library && !studyDone(s, id) && !onThePhone(s) && s.energy >= def.energy
  );
}
/** Avancer d'une étape (lire 20 pages, une séance…) : consomme l'énergie accumulée au repos. */
export function studyStep(s: GameState, id: string): boolean {
  if (!canStudyStep(s, id)) return false;
  s.energy -= LIBRARY_BY_ID[id].energy;
  s.plonge.library[id] += 1;
  return true;
}
/** Libellé de l'étape suivante (« Lire 20 pages », puis « Passer l'examen » pour la dernière). */
export function studyStepLabel(s: GameState, def: StudyItemDef): string {
  const done = s.plonge.library[def.id] ?? 0;
  return def.lastStep && done === def.steps - 1 ? def.lastStep : def.step;
}
/** Sous-titre chiffré d'une étape : ce qu'elle coûte et ce qu'elle fait avancer. */
export function studyStepEffects(s: GameState, def: StudyItemDef): string[] {
  const done = (s.plonge.library[def.id] ?? 0) * def.perStep;
  const total = def.steps * def.perStep;
  return [`Coûte ${def.energy} énergie`, `${def.unit[0].toUpperCase()}${def.unit.slice(1)} : ${done} → ${done + def.perStep} sur ${total}`];
}
/** Sous-titre chiffré d'un achat d'étude : ce qu'il y a à faire, et ce que ça coûte en énergie. */
export function studyBuyEffects(def: StudyItemDef): string[] {
  const total = def.steps * def.perStep;
  const per = def.perStep > 1 ? `les ${def.perStep} ${def.unit}` : `par ${def.unit.replace(/s$/, "")}`;
  return [`${total} ${def.unit}, ${def.energy} énergie ${per}`];
}
export function studyProgress(s: GameState, def: StudyItemDef): { done: number; total: number } {
  return { done: (s.plonge.library[def.id] ?? 0) * def.perStep, total: def.steps * def.perStep };
}
export const ANNONCE_EFFECTS = ["Tu quittes la plonge. Tu fais des sites, payés à la livraison."];
export function examPassed(s: GameState): boolean {
  return studyDone(s, LIBRARY[LIBRARY.length - 1].id);
}
export function canAnswerAnnonce(s: GameState): boolean {
  return s.job === "plongeur" && examPassed(s);
}
/** Répondre à l'annonce de Mme Duval : on quitte la plonge, on devient développeur. */
export function answerAnnonce(s: GameState): boolean {
  if (!canAnswerAnnonce(s)) return false;
  s.job = "developpeur";
  s.flags.energyVisible = true; // le travail de dev sollicite l'énergie
  s.flags.firstColor = true; // récompense de fin d'Acte I : la première couleur apparaît
  s.plonge.chef = "annonce";
  return true;
}

// --- Hors-ligne ---

/** Revenu hors-ligne au plongeur : les machines seules, limitées par ce que le restaurant salit. */
export function plongeOfflineIncomePerSec(s: GameState): Decimal {
  const plates = Math.min(machineRunning(s) ? machineRate(s) : 0, weeklyArrivalRate(s));
  return D(plates).mul(s.valuePerDish);
}

// --- Le tick ---

export function tickPlonge(s: GameState, t: number): void {
  const p = s.plonge;
  const prevDay = dayIndex(s);
  p.day += t;
  const today = dayIndex(s);
  if (today !== prevDay) {
    p.emptyToday = 0;
    // La plainte arrive au service qui suit la fournée rangée grasse.
    if (p.complaint) {
      p.complaint = false;
      p.chef = "plainte";
    }
    // Maman appelle le dimanche à midi, une fois par semaine.
    const week = Math.floor(today / 7);
    if (today % 7 === SUNDAY && p.callWeek !== week) {
      p.callWeek = week;
      p.callRing = CALL_RING_SECS;
    }
  }

  // Le restaurant salit des assiettes ; au-delà de la place disponible, le chef lave lui-même.
  p.pile += arrivalRate(s) * t;
  const cap = pileCap(s);
  if (p.pile > cap) {
    p.overflow += p.pile - cap;
    p.pile = cap;
    if (p.overflowDay !== today) {
      p.overflowDay = today;
      p.chef = "debordement";
    }
  }

  // L'appel : il sonne, puis on parle (les mains s'arrêtent et se reposent).
  if (p.callRing > 0) {
    p.callRing -= t;
    if (p.callRing <= 0) {
      p.callRing = 0;
      remember(s, "lien", CALL_MISSED, true);
    }
  }
  if (p.callTalk > 0) {
    p.callTalk -= t;
    if (p.callTalk <= 0) {
      p.callTalk = 0;
      remember(s, "lien", CALL_SOUVENIR, false);
    }
  }

  // Les machines d'abord (elles ne se fatiguent pas), puis les mains prennent le reste.
  let washed = 0;
  if (p.relaunchLeft > 0) p.relaunchLeft = Math.max(0, p.relaunchLeft - t);
  if (machineRunning(s) && machineRate(s) > 0) {
    const w = Math.min(p.pile, machineRate(s) * t);
    p.pile -= w;
    washed += w;
    if (p.cycleCourt && w > 0) {
      p.loadClock += t;
      if (p.loadClock >= LOAD_SECS) {
        p.loadClock -= LOAD_SECS;
        p.loads += 1;
        if (p.loads % GREASY_EVERY === 0) p.greasy = true;
      }
    }
  }
  const hands = Math.min(p.pile, handRateNow(s) * t);
  p.pile -= hands;
  washed += hands;
  pay(s, washed);

  // Énergie : la fatigue des mains contre le repos continu.
  s.energy = Math.max(0, Math.min(ENERGY_MAX, s.energy + ENERGY_REGEN * t - hands * p.fatigue));

  // Le coup de main vient avec l'habitude.
  if (!p.handUnlocked && p.washed >= HAND_UNLOCK_PLATES) {
    p.handUnlocked = true;
    s.handWashing = true;
    s.handRate = Math.max(s.handRate, HAND_RATE);
    s.flags.energyVisible = true;
    p.chef = "coup_de_main";
  }

  // Tu suis le restaurant : la pile est vide un jour ouvert.
  if (openToday(s) && p.pile < 1) p.emptyToday += t;

  // Inactivité (la fenêtre) : le téléphone ne compte pas comme du temps libre.
  if (p.callTalk <= 0) p.idle += t;

  // La montre : gains réels, seconde par seconde, sur une minute glissante.
  p.gainsClock += t;
  while (p.gainsClock >= 1) {
    p.gainsClock -= 1;
    p.gains.push(p.gainsAcc);
    p.gainsAcc = 0;
    if (p.gains.length > 60) p.gains.shift();
  }
}
