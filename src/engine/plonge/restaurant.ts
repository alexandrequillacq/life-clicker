import type { GameState } from "../state";
import {
  DAY_SECS,
  PEAK_SECS,
  PEAK_SHARE,
  PLATES_PER_COVER,
  PILE_BASE_CAP,
  DAY_NAMES,
  SUNDAY,
  EMPTY_LABEL_SECS,
} from "../content/plonge";
import { handsBusy, markAction } from "./commun";

// Le restaurant : le calendrier, l'affluence, la pile finie, le clic et la paie.
// Le restaurant salit des assiettes au rythme de ses couverts ; on lave ce qui arrive (jamais plus).

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

// --- Affluence et pile ---

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
export function arrivalsIn(s: GameState, secs: number): number {
  const step = 0.25;
  let total = 0;
  for (let t = 0; t < secs; t += step) total += arrivalRateAt(s, s.plonge.day + t) * Math.min(step, secs - t);
  return total;
}
/** Assiettes par seconde en moyenne sur un jour ouvert. */
export function openDayArrivalRate(s: GameState): number {
  return (s.plonge.covers * PLATES_PER_COVER) / DAY_SECS;
}
export function openDaysShare(s: GameState): number {
  return (s.plonge.sundayOpen ? 7 : 6) / 7;
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
