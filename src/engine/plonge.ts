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
  PILE_VISIBLE_AT,
  CHEF_REVEAL_DELAY,
  ASK_GAP_DAYS,
  FIRST_CALL_WEEK,
  SUNDAY_OFFER_DELAY,
  LIVRET_DELAY,
  NOVELTY_GAP,
  LIVRET_WITHOUT_SUNDAY,
  PRO_OFFER_DELAY,
  MEAL_ENERGY,
  MEALS_PER_DAY,
  MEAL_REVEAL_DELAY,
  LIVRET_RATE,
  CYCLE_COURT_MULT,
  LOAD_SECS,
  GREASY_EVERY,
  RELAUNCH_SECS,
  ENERGY_REGEN,
  CALL_RING_SECS,
  CALL_TALK_SECS,
  WINDOW_IDLE_SECS,
  ASK_EMPTY_SECS,
  EMPTY_LABEL_SECS,
  EQUIPMENT_BY_ID,
  ASKS,
  SUNDAY_OFFER,
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
// rythme de ses couverts, on lave ce qui arrive (jamais plus). Le clic est le seul lavage à la main ;
// les machines prennent le relais et ne se fatiguent pas. Chaque information se révèle seule, à son heure.
// Automatiser son travail libère du temps et de l'énergie pour sa vie (la bibliothèque).

const fmtRate = (n: number): string => (Math.round(n * 10) / 10).toString().replace(".", ",");
export const fmtEuros = (n: number): string => `${n.toFixed(2).replace(".", ",")} €`;

// --- Calendrier ---

export function dayIndex(s: GameState): number {
  return Math.floor(s.plonge.day / DAY_SECS);
}
function dayOfWeekAt(day: number): number {
  return Math.floor(day / DAY_SECS) % 7;
}
export function dayName(s: GameState): string {
  return DAY_NAMES[dayOfWeekAt(s.plonge.day)];
}
function openAt(s: GameState, day: number): boolean {
  return dayOfWeekAt(day) !== SUNDAY || s.plonge.sundayOpen;
}
export function openToday(s: GameState): boolean {
  return openAt(s, s.plonge.day);
}
function peakAt(s: GameState, day: number): boolean {
  return openAt(s, day) && day - Math.floor(day / DAY_SECS) * DAY_SECS < PEAK_SECS;
}
/** Le coup de feu de midi : les premières secondes de chaque jour ouvert. */
export function isPeak(s: GameState): boolean {
  return peakAt(s, s.plonge.day);
}
export function pileCap(s: GameState): number {
  return PILE_BASE_CAP + s.plonge.covers;
}
function arrivalRateAt(s: GameState, day: number): number {
  if (!openAt(s, day)) return 0;
  const plates = s.plonge.covers * PLATES_PER_COVER;
  return peakAt(s, day) ? (plates * PEAK_SHARE) / PEAK_SECS : (plates * (1 - PEAK_SHARE)) / (DAY_SECS - PEAK_SECS);
}
/** Assiettes sales/s qui arrivent en ce moment. */
export function arrivalRate(s: GameState): number {
  return arrivalRateAt(s, s.plonge.day);
}
/** Assiettes sales qui arriveront dans les `secs` prochaines secondes. */
function arrivalsIn(s: GameState, secs: number): number {
  const step = 0.25;
  let total = 0;
  for (let t = 0; t < secs; t += step) total += arrivalRateAt(s, s.plonge.day + t) * Math.min(step, secs - t);
  return total;
}
/** Assiettes par seconde en moyenne sur un jour ouvert. */
function openDayArrivalRate(s: GameState): number {
  return (s.plonge.covers * PLATES_PER_COVER) / DAY_SECS;
}
function openDaysShare(s: GameState): number {
  return (s.plonge.sundayOpen ? 7 : 6) / 7;
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

// --- Argent ---

function pay(s: GameState, plates: number): void {
  if (plates <= 0) return;
  const euros = plates * s.valuePerDish.toNumber();
  s.money = s.money.add(euros);
  s.plonge.washed += plates;
  s.plonge.earned += euros;
}
/** Ce que rapportent des machines de ce débit, sans toi : limité par ce que le restaurant salit. */
function autoIncomeFor(s: GameState, rate: number): number {
  return Math.min(rate, openDayArrivalRate(s)) * openDaysShare(s) * s.valuePerDish.toNumber() * 60;
}
/** L'argent qui tombe tout seul, en € / min (hors clic) ; 0 quand la machine est à l'arrêt. */
export function autoIncomePerMin(s: GameState): number {
  return machineRunning(s) ? autoIncomeFor(s, machineRate(s)) : 0;
}
/** Libellé du revenu automatique (au pluriel une fois le lave-vaisselle pro installé). */
export function autoIncomeLine(s: GameState): string {
  const who = s.plonge.proRate > 0 ? "Les lave-vaisselle te rapportent" : "Le lave-vaisselle te rapporte";
  return `${who} ${fmtEuros(autoIncomePerMin(s))} / min`;
}
function incomeEffects(s: GameState, now: number, after: number, plural = s.plonge.proRate > 0): string[] {
  const who = plural ? "Les lave-vaisselle te rapportent" : "Il te rapporte";
  const a = autoIncomeFor(s, now);
  const b = autoIncomeFor(s, after);
  const out = b - a >= 0.005 ? [`${who} : ${fmtEuros(a)} → ${fmtEuros(b)} / min`] : [];
  if (after >= openDayArrivalRate(s)) out.push("Pas plus : le restaurant ne salit pas plus d'assiettes.");
  return out;
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
/** Laver à la main : le seul lavage manuel, limité par la pile, impossible au téléphone. */
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

/** La pile est vide depuis un moment : le bouton le dit (un creux d'une fraction de seconde ne compte pas). */
export function noDirtyPlates(s: GameState): boolean {
  return s.plonge.pile < 1 && s.plonge.emptyFor >= EMPTY_LABEL_SECS;
}

// --- Ce qui est révélé : une information à la fois ---

export function isRevealed(s: GameState, key: string): boolean {
  return s.plonge.revealed[key] !== undefined;
}
/** L'écran vient de changer par une action du joueur : les révélations suivantes attendent. */
function novelty(s: GameState): void {
  s.plonge.lastNovelty = s.plonge.day;
}
function noveltyFree(s: GameState): boolean {
  return s.plonge.day >= s.plonge.lastNovelty + NOVELTY_GAP;
}
/** Révèle `key` si c'est prêt et qu'aucune autre nouveauté n'est trop récente. */
function tryReveal(s: GameState, key: string, ready: boolean): boolean {
  if (isRevealed(s, key)) return true;
  if (!ready || !noveltyFree(s)) return false;
  s.plonge.revealed[key] = s.plonge.day;
  novelty(s);
  return true;
}
function since(s: GameState, id: string): number {
  const at = s.plonge.boughtAt[id];
  return at === undefined ? -Infinity : s.plonge.day - at;
}
function callOngoing(s: GameState): boolean {
  return s.plonge.callRing > 0 || s.plonge.callTalk > 0;
}
/** La file des nouveautés que le jeu révèle de lui-même, dans l'ordre, une à la fois. */
function revealQueue(s: GameState): void {
  const p = s.plonge;
  if (tryReveal(s, "pile", p.day >= PILE_VISIBLE_AT && (p.pile < 1 || p.overflow > 0))) p.pileVisible = true;
  tryReveal(s, "chef", p.oldRate > 0 && since(s, "reparer") >= CHEF_REVEAL_DELAY);
  tryReveal(s, "dimanche", since(s, "panier") >= SUNDAY_OFFER_DELAY && isRevealed(s, "maman") && !callOngoing(s));
  tryReveal(
    s,
    "livret",
    !callOngoing(s) &&
      (since(s, "service_call") >= LIVRET_DELAY || since(s, "panier") >= LIVRET_WITHOUT_SUNDAY),
  );
  tryReveal(s, "offre_pro", since(s, "detartrer") >= PRO_OFFER_DELAY);
  tryReveal(s, "repas", s.manualRetired && since(s, "gants_poses") >= MEAL_REVEAL_DELAY);
}


/** La montre donne le jour et le coup de feu. */
export function dayVisible(s: GameState): boolean {
  return !!s.plonge.equipment["montre"];
}
/** Les couverts se révèlent avec la première demande acceptée. */
export function coversVisible(s: GameState): boolean {
  return s.plonge.asksDone > 0 || s.plonge.sundayOpen;
}
/** La colonne « Ta vie » naît avec le premier appel de Maman (ou le temps libre). */
export function lifeVisible(s: GameState): boolean {
  const p = s.plonge;
  return s.souvenirs.length > 0 || p.callRing > 0 || p.callTalk > 0 || s.manualRetired;
}

// --- Équipement ---

export function equipmentVisible(s: GameState, def: EquipmentDef): boolean {
  const p = s.plonge;
  if (s.job !== "plongeur" || p.equipment[def.id]) return false;
  if (def.revealAt !== undefined && p.day < def.revealAt) return false;
  if (def.reveal && !isRevealed(s, def.reveal)) return false;
  if (!def.requires) return true;
  if (!p.equipment[def.requires]) return false;
  return def.revealDelay === undefined || p.day >= (p.boughtAt[def.requires] ?? 0) + def.revealDelay;
}
export function canBuyEquipment(s: GameState, id: string): boolean {
  const def = EQUIPMENT_BY_ID[id];
  return !!def && equipmentVisible(s, def) && s.money.gte(def.cost) && !onThePhone(s);
}
export function buyEquipment(s: GameState, id: string): boolean {
  if (!canBuyEquipment(s, id)) return false;
  const def = EQUIPMENT_BY_ID[id];
  s.money = s.money.sub(def.cost);
  s.plonge.equipment[id] = true;
  s.plonge.boughtAt[id] = s.plonge.day;
  if (def.dishesPerClick !== undefined) s.dishesPerClick = def.dishesPerClick;
  if (def.oldRate !== undefined) s.plonge.oldRate = def.oldRate;
  if (def.oldMult !== undefined) s.plonge.oldMult *= def.oldMult;
  if (def.proRate !== undefined) {
    s.plonge.proRate = def.proRate;
    s.plonge.greasy = false; // le lave-vaisselle pro ne sort pas d'assiettes grasses
  }
  if (def.chef) s.plonge.chef = def.chef;
  if (def.novelty) novelty(s);
  markAction(s);
  return true;
}
/** Sous-titres chiffrés : la statistique qui change avec cet achat (règle dure : toujours affichée). */
export function equipmentEffects(s: GameState, def: EquipmentDef): string[] {
  const out: string[] = [];
  if (def.dishesPerClick !== undefined) out.push(`Par clic : ${s.dishesPerClick} → ${def.dishesPerClick} assiettes`);
  if (def.watch) out.push("Affiche le jour de la semaine", "Et le coup de feu de midi : la moitié des assiettes du jour");
  const cc = s.plonge.cycleCourt ? CYCLE_COURT_MULT : 1;
  if (def.oldRate !== undefined) {
    const after = def.oldRate * cc;
    out.push(`Vieux lave-vaisselle : 0 → ${fmtRate(after)} assiettes / s`);
    out.push(`Il te rapporte ${fmtEuros(autoIncomeFor(s, after))} / min, même sans toi.`);
  }
  if (def.oldMult !== undefined) {
    const now = oldMachineRate(s) * cc;
    const after = now * def.oldMult;
    out.push(`Vieux lave-vaisselle : ${fmtRate(now)} → ${fmtRate(after)} assiettes / s`);
    out.push(...incomeEffects(s, machineRate(s), machineRate(s) - now + after));
  }
  if (def.proRate !== undefined) {
    const now = machineRate(s);
    const after = now + def.proRate * cc;
    out.push(`Lave-vaisselle : ${fmtRate(now)} → ${fmtRate(after)} assiettes / s`);
    out.push(...incomeEffects(s, now, after, true));
    if (s.plonge.cycleCourt) out.push("Plus d'assiettes grasses : il lave bien, même en cycle court.");
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
  const after = now * CYCLE_COURT_MULT;
  return [
    `Lave-vaisselle : ${fmtRate(now)} → ${fmtRate(after)} assiettes / s`,
    ...incomeEffects(s, now, after),
    "Certaines assiettes ressortent grasses.",
  ];
}
export function setCycleCourt(s: GameState): boolean {
  if (!cycleCourtAvailable(s) || onThePhone(s)) return false;
  s.plonge.cycleCourt = true;
  markAction(s);
  return true;
}
/** Relancer un cycle : on relave, la machine ne sort rien pendant RELAUNCH_SECS. */
export function relaunchCycle(s: GameState): boolean {
  if (!s.plonge.greasy || onThePhone(s)) return false;
  s.plonge.greasy = false;
  s.plonge.relaunchLeft = RELAUNCH_SECS;
  markAction(s);
  return true;
}
/** Les ranger quand même : rien de perdu pour toi. Le client paiera au service suivant. */
export function shelveGreasy(s: GameState): boolean {
  if (!s.plonge.greasy || onThePhone(s)) return false;
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
/** « Le chef » paraît un moment après la réparation du vieux lave-vaisselle. */
export function chefVisible(s: GameState): boolean {
  return s.job === "plongeur" && isRevealed(s, "chef");
}
function askedToday(s: GameState): boolean {
  return dayIndex(s) - s.plonge.lastAskDay < ASK_GAP_DAYS;
}
/**
 * Le chef veut bien grandir si tu suis : moins d'une brassée d'assiettes sales (ce que lave un clic)
 * pendant ASK_EMPTY_SECS dans la journée. Au plus une demande par jour.
 */
export function canAskChef(s: GameState): boolean {
  const p = s.plonge;
  return (
    chefVisible(s) &&
    currentAsk(s) !== null &&
    p.emptyToday >= ASK_EMPTY_SECS &&
    !askedToday(s) &&
    !onThePhone(s)
  );
}
/** Ce que le chef attend pour dire oui, et où tu en es aujourd'hui (le bouton grisé donne la cible). */
export function askStatus(s: GameState): string[] {
  if (askedToday(s)) return ["Tu as déjà proposé aujourd'hui. Le chef répondra demain."];
  const n = Math.max(1, s.dishesPerClick);
  return [
    `Le chef dit oui si tu suis : moins de ${n} assiette${n > 1 ? "s" : ""} sale${n > 1 ? "s" : ""} pendant ${ASK_EMPTY_SECS} s dans la journée`,
    `Aujourd'hui : ${Math.min(ASK_EMPTY_SECS, Math.floor(s.plonge.emptyToday))} s sur ${ASK_EMPTY_SECS}`,
  ];
}
export function askEffects(s: GameState, def: AskDef): string[] {
  const out: string[] = [];
  if (def.covers) out.push(`Couverts par jour : ${s.plonge.covers} → ${s.plonge.covers + def.covers}`);
  if (def.covers && s.plonge.asksDone === 0) out.push(`1 couvert = ${PLATES_PER_COVER} assiettes sales`);
  if (def.sunday) out.push("Jours ouverts par semaine : 6 → 7");
  if (def.note) out.push(def.note);
  return out;
}
function applyAsk(s: GameState, def: AskDef): void {
  if (def.covers) s.plonge.covers += def.covers;
  if (def.sunday) s.plonge.sundayOpen = true;
  if (def.chef) s.plonge.chef = def.chef;
  markAction(s);
}
export function askChef(s: GameState): boolean {
  if (!canAskChef(s)) return false;
  applyAsk(s, currentAsk(s)!);
  if (s.plonge.asksDone === 0) novelty(s); // les couverts s'affichent
  s.plonge.asksDone += 1;
  s.plonge.lastAskDay = dayIndex(s);
  return true;
}
/** Ouvrir le dimanche : une proposition unique, un moment après le panier, une fois que Maman a appelé. */
export function canOfferSunday(s: GameState): boolean {
  const p = s.plonge;
  return s.job === "plongeur" && !p.sundayOpen && isRevealed(s, "dimanche");
}
export function offerSunday(s: GameState): boolean {
  if (!canOfferSunday(s) || onThePhone(s)) return false;
  applyAsk(s, SUNDAY_OFFER);
  novelty(s);
  return true;
}

// --- Le livret A : l'argent qui travaille pour toi ---

/** Le livret A se propose un moment après le détartrage, une fois que Maman a appelé en plein service. */
export function canOpenLivret(s: GameState): boolean {
  const p = s.plonge;
  return s.job === "plongeur" && !p.livret && isRevealed(s, "livret");
}
export function livretEffects(s: GameState): string[] {
  return [
    `Chaque lundi : +${Math.round(LIVRET_RATE * 100)} % de ton argent`,
    `Aujourd'hui, ce serait +${fmtEuros(s.money.toNumber() * LIVRET_RATE)}`,
  ];
}
export function openLivret(s: GameState): boolean {
  if (!canOpenLivret(s) || onThePhone(s)) return false;
  s.plonge.livret = true;
  s.plonge.chef = "banque";
  markAction(s);
  return true;
}
export function livretLine(s: GameState): string {
  return s.plonge.lastInterest > 0
    ? `Livret A : +${fmtEuros(s.plonge.lastInterest)} lundi dernier`
    : `Livret A : ${Math.round(LIVRET_RATE * 100)} % chaque lundi`;
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
/** Ce que coûte de décrocher : pendant l'appel, le chef lave ce que la machine ne suit pas. */
function callLoss(s: GameState): number {
  if (s.manualRetired) return 0;
  const lost = arrivalsIn(s, CALL_TALK_SECS) - (machineRunning(s) ? machineRate(s) : 0) * CALL_TALK_SECS;
  return Math.max(0, lost) * s.valuePerDish.toNumber();
}
export function callEffects(s: GameState): string[] {
  const out = [`${CALL_TALK_SECS} s au téléphone : tout s'arrête`];
  if (s.flags.energyVisible) out.push(`Énergie : ${Math.round(s.energy)} → ${ENERGY_MAX}`);
  const loss = callLoss(s);
  if (loss >= 0.01) out.push(`Pendant ce temps, le chef lave à ta place. Tu perds environ ${fmtEuros(loss)}.`);
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
  return (
    s.job === "plongeur" &&
    lifeVisible(s) &&
    !onThePhone(s) &&
    s.plonge.idle >= WINDOW_IDLE_SECS &&
    s.plonge.windowDay !== dayIndex(s)
  );
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
  return [
    `Tu arrêtes de laver. Les lave-vaisselle suivent seuls : ${fmtRate(machineRate(s))} assiettes / s pour ${fmtRate(openDayArrivalRate(s))} de vaisselle en moyenne.`,
    "Nouveau : tes études.",
  ];
}
/** Poser les gants : plus de travail manuel, place au temps libre (et à l'énergie qu'il demande). */
export function retireHands(s: GameState): void {
  s.manualRetired = true;
  s.flags.energyVisible = true;
  s.plonge.boughtAt["gants_poses"] = s.plonge.day;
  novelty(s);
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
  return !!def && studyBuyVisible(s, id) && s.money.gte(def.cost) && !onThePhone(s);
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
  return s.job === "plongeur" && examPassed(s) && !onThePhone(s);
}

// --- Les gestes de vie qui redonnent de l'énergie ---

export function mealVisible(s: GameState): boolean {
  return libraryVisible(s) && isRevealed(s, "repas");
}
export function canEat(s: GameState): boolean {
  return mealVisible(s) && s.plonge.mealsToday < MEALS_PER_DAY && s.energy < ENERGY_MAX && !onThePhone(s);
}
export function mealEffects(s: GameState): string[] {
  if (s.plonge.mealsToday >= MEALS_PER_DAY) return ["Tu as déjà mangé. Demain."];
  return [`Énergie : ${Math.round(s.energy)} → ${Math.min(ENERGY_MAX, Math.round(s.energy + MEAL_ENERGY))}`, `${MEALS_PER_DAY} repas par jour`];
}
/** Se faire à manger : une corvée de vie, qui recharge sans poser de souvenir. */
export function eat(s: GameState): boolean {
  if (!canEat(s)) return false;
  s.energy = Math.min(ENERGY_MAX, s.energy + MEAL_ENERGY);
  s.plonge.mealsToday += 1;
  return true;
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
  return D(autoIncomePerMin(s) / 60);
}

// --- Le tick ---

export function tickPlonge(s: GameState, t: number): void {
  const p = s.plonge;
  const prevDay = dayIndex(s);
  p.day += t;
  const today = dayIndex(s);
  if (today !== prevDay) {
    p.emptyToday = 0;
    p.overflowToday = 0;
    p.mealsToday = 0;
    // La plainte arrive au service qui suit la fournée rangée grasse.
    if (p.complaint) {
      p.complaint = false;
      p.chef = "plainte";
    }
    // Maman appelle le dimanche à midi, une fois par semaine, à partir du 3e dimanche.
    const week = Math.floor(today / 7);
    const sunday = today % 7 === SUNDAY;
    const firstCall = sunday && !isRevealed(s, "maman") && week >= FIRST_CALL_WEEK && tryReveal(s, "maman", true);
    // Le premier appel en plein service est une nouveauté : il attend son tour (Maman rappellera dimanche prochain).
    const service = p.sundayOpen && !s.manualRetired;
    const callOk = sunday && (isRevealed(s, "maman") || firstCall) && p.callWeek !== week;
    if (callOk && (!service || p.serviceCall || tryReveal(s, "service", true))) {
      p.callWeek = week;
      p.callRing = CALL_RING_SECS;
      if (p.sundayOpen && !s.manualRetired && !p.serviceCall) {
        p.serviceCall = true;
        p.boughtAt["service_call"] = p.day;
      }
    }
    // Le livret A verse ses intérêts chaque lundi.
    if (today % 7 === 0 && p.livret) {
      const interest = s.money.toNumber() * LIVRET_RATE;
      s.money = s.money.add(interest);
      p.lastInterest = interest;
    }
  }

  // Le restaurant salit des assiettes ; au-delà de la place disponible, le chef lave lui-même.
  const pileBefore = p.pile;
  p.pile += arrivalRate(s) * t;

  // L'appel : il sonne, puis on parle (les mains s'arrêtent).
  if (p.callRing > 0) {
    p.callRing -= t;
    if (p.callRing <= 0) {
      p.callRing = 0;
      remember(s, "lien", CALL_MISSED, true);
    }
  }
  const talking = p.callTalk > 0;
  if (p.callTalk > 0) {
    p.callTalk -= t;
    if (p.callTalk <= 0) {
      p.callTalk = 0;
      s.energy = ENERGY_MAX; // parler à Maman recharge complètement
      remember(s, "lien", CALL_SOUVENIR, false);
    }
  }

  // Les machines lavent (elles ne se fatiguent pas).
  if (p.relaunchLeft > 0) p.relaunchLeft = Math.max(0, p.relaunchLeft - t);
  if (machineRunning(s) && machineRate(s) > 0) {
    const w = Math.min(p.pile, machineRate(s) * t);
    p.pile -= w;
    pay(s, w);
    if (p.cycleCourt && w > 0) {
      p.loadClock += t;
      if (p.loadClock >= LOAD_SECS) {
        p.loadClock -= LOAD_SECS;
        p.loads += 1;
        // La première fournée grasse attend son tour dans la file des nouveautés.
        if (p.loads % GREASY_EVERY === 0 && p.proRate === 0 && tryReveal(s, "grasses", true)) p.greasy = true;
      }
    }
  }

  // Au téléphone en plein service, le chef lave à ta place ce que la machine ne suit pas.
  let lost = 0;
  if (talking && !s.manualRetired && p.pile > pileBefore) {
    lost = p.pile - pileBefore;
    p.pile = pileBefore;
  }
  const cap = pileCap(s);
  if (p.pile > cap) {
    lost += p.pile - cap;
    p.pile = cap;
  }
  if (lost > 0) {
    p.overflow += lost;
    p.overflowToday += lost;
    if (p.pileVisible && p.overflowDay !== today) {
      p.overflowDay = today;
      if (p.chef !== "debordement") p.chefBefore = p.chef;
      p.chef = "debordement";
    }
  }
  // La réplique du débordement s'efface quand la pile redescend.
  if (p.chef === "debordement" && p.pile < pileCap(s) * 0.7) p.chef = p.chefBefore;

  // Le compteur d'assiettes se révèle quand la pile se vide (ou déborde) pour la première fois.
  revealQueue(s);

  // Énergie : le repos continu (elle ne se dépense qu'en études).
  s.energy = Math.min(ENERGY_MAX, s.energy + ENERGY_REGEN * t);

  // Tu suis le restaurant : la pile est vide un jour ouvert.
  if (openToday(s) && p.pile < Math.max(1, s.dishesPerClick)) p.emptyToday += t;
  p.emptyFor = p.pile < 1 ? p.emptyFor + t : 0;

  // Inactivité (la fenêtre) : le téléphone ne compte pas comme du temps libre.
  if (p.callTalk <= 0) p.idle += t;
}
