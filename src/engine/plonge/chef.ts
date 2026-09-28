import type { GameState } from "../state";
import { PLATES_PER_COVER, ASK_GAP_DAYS, KEEP_UP_SECS, LIVRET_RATE, ASKS, SUNDAY_OFFER, DAY_NAMES, TEXTES, type AskDef } from "../content/plonge";
import { fmtEuros, onThePhone } from "./commun";
import { dayIndex } from "./restaurant";
import { loadUnit } from "./equipement";
import { acted, isRevealed, eventAt } from "./revelations";

// Le chef : les demandes (le joueur réclame lui-même plus de travail, au même tarif), le dimanche,
// et la banque (le livret A, l'argent qui travaille pour toi).

// --- Les demandes au chef ---

/** La demande suivante, si elle peut déjà se proposer (le deuxième restaurant attend les gants posés). */
export function currentAsk(s: GameState): AskDef | null {
  const ask = ASKS[s.plonge.asksDone];
  return ask && (!ask.needs || eventAt(s, ask.needs) !== undefined) ? ask : null;
}
/** « Le chef » paraît un moment après les gants. */
export function chefVisible(s: GameState): boolean {
  return s.job === "plongeur" && isRevealed(s, "chef");
}
function askedToday(s: GameState): boolean {
  return dayIndex(s) - s.plonge.lastAskDay < ASK_GAP_DAYS;
}
/**
 * Le chef veut bien grandir si tu suis : moins d'une brassée d'assiettes sales (ce que lave un clic,
 * ou une seconde de machines) pendant KEEP_UP_SECS d'un jour ouvert. Au plus une demande par jour.
 */
export function canAskChef(s: GameState): boolean {
  return chefVisible(s) && currentAsk(s) !== null && s.plonge.emptyToday >= KEEP_UP_SECS && !askedToday(s) && !onThePhone(s);
}
/** Ce que le chef attend pour dire oui, et où tu en es aujourd'hui (le bouton grisé donne la cible). */
export function askStatus(s: GameState): string[] {
  if (askedToday(s)) return [TEXTES.askedToday];
  return [
    TEXTES.askTarget(Math.round(loadUnit(s)), KEEP_UP_SECS),
    TEXTES.askProgress(Math.min(KEEP_UP_SECS, Math.floor(s.plonge.emptyToday)), KEEP_UP_SECS),
  ];
}
function coversAfter(s: GameState, def: AskDef): number {
  return def.doubleCovers ? s.plonge.covers * 2 : s.plonge.covers + (def.covers ?? 0);
}
export function askEffects(s: GameState, def: AskDef): string[] {
  const out: string[] = [];
  if (def.covers || def.doubleCovers) out.push(TEXTES.askCovers(s.plonge.covers, coversAfter(s, def)));
  if (def.covers && s.plonge.asksDone === 0) out.push(TEXTES.coverPlates(PLATES_PER_COVER));
  if (def.sunday) out.push(TEXTES.openDays(DAY_NAMES.length - 1, DAY_NAMES.length));
  if (def.note) out.push(def.note);
  return out;
}
function applyAsk(s: GameState, def: AskDef): void {
  s.plonge.covers = coversAfter(s, def);
  if (def.sunday) s.plonge.sundayOpen = true;
  if (def.chef) s.plonge.chef = def.chef;
  s.plonge.boughtAt[def.id] = s.plonge.day;
}
export function askChef(s: GameState): boolean {
  if (!canAskChef(s)) return false;
  applyAsk(s, currentAsk(s)!);
  s.plonge.asksDone += 1;
  s.plonge.lastAskDay = dayIndex(s);
  acted(s);
  return true;
}
/** Ouvrir le dimanche : une proposition unique, après plusieurs appels de Maman. */
export function canOfferSunday(s: GameState): boolean {
  return s.job === "plongeur" && !s.plonge.sundayOpen && isRevealed(s, "dimanche");
}
export function offerSunday(s: GameState): boolean {
  if (!canOfferSunday(s) || onThePhone(s)) return false;
  applyAsk(s, SUNDAY_OFFER);
  acted(s);
  return true;
}

// --- Le livret A : l'argent qui travaille pour toi ---

export function canOpenLivret(s: GameState): boolean {
  return s.job === "plongeur" && !s.plonge.livret && isRevealed(s, "livret");
}
export function openLivret(s: GameState): boolean {
  if (!canOpenLivret(s) || onThePhone(s)) return false;
  s.plonge.livret = true;
  s.plonge.chef = "banque";
  acted(s);
  return true;
}
export function depositLivret(s: GameState): boolean {
  const p = s.plonge;
  if (!p.livret || s.money.lte(0) || onThePhone(s)) return false;
  p.livretBalance += s.money.toNumber();
  s.money = s.money.sub(s.money);
  acted(s);
  return true;
}
export function withdrawLivret(s: GameState): boolean {
  const p = s.plonge;
  if (!p.livret || p.livretBalance <= 0 || onThePhone(s)) return false;
  s.money = s.money.add(p.livretBalance);
  p.livretBalance = 0;
  p.livretLow = 0;
  acted(s);
  return true;
}
/** Ce que rapportera le prochain lundi : 1 % du plus petit solde depuis lundi. */
export function nextInterest(s: GameState): number {
  return Math.min(s.plonge.livretLow, s.plonge.livretBalance) * LIVRET_RATE;
}
/** Lundi : les intérêts, puis la nouvelle semaine repart du solde actuel. */
export function payInterest(s: GameState): void {
  const p = s.plonge;
  if (!p.livret) return;
  const interest = nextInterest(s);
  p.livretBalance += interest;
  p.lastInterest = interest;
  p.livretLow = p.livretBalance;
}
export function livretPct(): number {
  return Math.round(LIVRET_RATE * 100);
}
export function depositEffects(s: GameState): string[] {
  const m = s.money.toNumber();
  return TEXTES.depositEffects(fmtEuros(m), fmtEuros((s.plonge.livretBalance + m) * LIVRET_RATE));
}
