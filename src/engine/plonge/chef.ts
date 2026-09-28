import type { GameState } from "../state";
import { PLATES_PER_COVER, DAY_SECS, BEHIND_LOADS, KEEP_UP_SECS, ASK_MIN_GAP, ASK_LATE, LIVRET_RATE, ASKS, SUNDAY_OFFER, DAY_NAMES, TEXTES, type AskDef } from "../content/plonge";
import { fmtEuros, onThePhone } from "./commun";
import { acted, isRevealed, eventAt } from "./revelations";
import { machineRate, loadUnit } from "./equipement";

// Le chef : les demandes (le joueur réclame lui-même plus de travail, au même tarif), le dimanche,
// et la banque (le livret A, l'argent qui travaille pour toi).

// --- Les demandes au chef ---

/**
 * La demande suivante, si elle peut déjà se proposer (les dernières attendent les gants posés). Une fois les gants
 * posés, jamais plus d'assiettes que les lave-vaisselle ne peuvent en laver : elle attend la machine qu'il faut.
 */
export function currentAsk(s: GameState): AskDef | null {
  const ask = ASKS[s.plonge.asksDone];
  if (!ask || (ask.needs && eventAt(s, ask.needs) === undefined)) return null;
  if (s.manualRetired && (coversAfter(s, ask) * PLATES_PER_COVER) / DAY_SECS > machineRate(s) + 1e-9) return null;
  return ask;
}
/** « Le chef » paraît un moment après les gants. */
export function chefVisible(s: GameState): boolean {
  return s.job === "plongeur" && isRevealed(s, "chef");
}
/**
 * La demande suivante se propose quand tu suis le restaurant : moins d'une brassée d'assiettes sales (ce que lave
 * un clic, ou une seconde de machines) pendant KEEP_UP_SECS de jours ouverts depuis la précédente. Jamais moins de
 * ASK_MIN_GAP s après elle, au plus tard ASK_LATE s après (pas de blocage). La première vient avec le chef.
 */
export function askReady(s: GameState): boolean {
  const p = s.plonge;
  if (!chefVisible(s) || currentAsk(s) === null) return false;
  if (p.asksDone === 0) return true;
  const since = p.day - p.lastAskAt;
  // Au plus tard ASK_LATE s après, pourvu que la pile tienne en deux brassées (sinon, c'est une amélioration qui se propose).
  return since >= ASK_MIN_GAP && (p.keptUp >= KEEP_UP_SECS || (since >= ASK_LATE && p.pile < BEHIND_LOADS * loadUnit(s)));
}
/** La demande est à l'écran (une fois proposée, elle reste) : un clic, et le chef dit oui. */
export function askVisible(s: GameState): boolean {
  return s.plonge.askShown && chefVisible(s) && currentAsk(s) !== null;
}
export function canAskChef(s: GameState): boolean {
  return askVisible(s) && !onThePhone(s);
}
function coversAfter(s: GameState, def: AskDef): number {
  return s.plonge.covers + (def.covers ?? 0);
}
export function askEffects(s: GameState, def: AskDef): string[] {
  const out: string[] = [];
  if (def.covers) out.push(TEXTES.askCovers(s.plonge.covers, coversAfter(s, def)));
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
/** Proposer au chef : il dit oui, les couverts augmentent tout de suite. La suivante attendra que tu suives. */
export function askChef(s: GameState): boolean {
  if (!canAskChef(s)) return false;
  const p = s.plonge;
  applyAsk(s, currentAsk(s)!);
  p.asksDone += 1;
  p.lastAskAt = p.day;
  p.keptUp = 0;
  p.askShown = false;
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
/** La ligne du livret : le solde, et ce que rapportera un lundi si rien ne bouge d'ici là (la règle tant qu'il est vide). */
export function livretLine(s: GameState): string {
  const b = s.plonge.livretBalance;
  return TEXTES.livret(fmtEuros(b), b > 0 ? TEXTES.livretGain(fmtEuros(b * LIVRET_RATE)) : TEXTES.livretRule(livretPct()));
}
