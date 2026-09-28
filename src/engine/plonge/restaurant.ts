import type { GameState } from "../state";
import { DAY_SECS, PLATES_PER_COVER, PILE_BASE_CAP, DAY_NAMES, SUNDAY, EMPTY_LABEL_SECS } from "../content/plonge";
import { handsBusy, markAction } from "./commun";

// Le restaurant : le calendrier, l'affluence, la pile finie, le clic et la paie.
// Le restaurant salit des assiettes au rythme de ses couverts, régulièrement ; on lave ce qui arrive (jamais plus).

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
/** Secondes qui restent avant minuit. */
export function secsLeftToday(s: GameState): number {
  return DAY_SECS - (s.plonge.day - dayIndex(s) * DAY_SECS);
}
function openAt(s: GameState, day: number): boolean {
  return dayOfWeekAt(day) !== SUNDAY || s.plonge.sundayOpen;
}
export function openToday(s: GameState): boolean {
  return openAt(s, s.plonge.day);
}

// --- Affluence et pile ---

export function pileCap(s: GameState): number {
  return PILE_BASE_CAP + s.plonge.covers;
}
/** Assiettes par seconde en moyenne sur un jour ouvert (elles arrivent régulièrement). */
export function openDayArrivalRate(s: GameState): number {
  return (s.plonge.covers * PLATES_PER_COVER) / DAY_SECS;
}
function arrivalRateAt(s: GameState, day: number): number {
  return openAt(s, day) ? openDayArrivalRate(s) : 0;
}
/** Assiettes sales/s qui arrivent en ce moment. */
export function arrivalRate(s: GameState): number {
  return arrivalRateAt(s, s.plonge.day);
}
/** Assiettes sales qui arriveront dans les `secs` prochaines secondes. */
export function arrivalsIn(s: GameState, secs: number): number {
  const step = 0.25;
  let total = 0;
  for (let t = 0; t < secs; t += step) total += arrivalRateAt(s, s.plonge.day + t) * Math.min(step, secs - t);
  return total;
}
export function openDaysShare(s: GameState): number {
  return (s.plonge.sundayOpen ? DAY_NAMES.length : DAY_NAMES.length - 1) / DAY_NAMES.length;
}

// --- La paie ---

export function pay(s: GameState, plates: number): void {
  if (plates <= 0) return;
  const euros = plates * s.valuePerDish.toNumber();
  s.money = s.money.add(euros);
  s.plonge.washed += plates;
  s.plonge.earned += euros;
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
