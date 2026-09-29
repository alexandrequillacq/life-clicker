import type { GameState } from "../state";
import {
  FL_ENERGY_REGEN,
  FL_DAY_SECS,
  MEALS_PER_DAY,
  MEAL_PRICE,
  DINNER_ENERGY,
  FIRST_DINNER_DAY,
  FRIENDS_MAX_MISSES,
  OUTING_ENERGY,
  OUTINGS,
  MAMAN_LINES,
  DAY_NAMES,
  FRIDAY,
  SUNDAY,
  TEXTES,
} from "../content/freelance";
import { handsFree, remember, secsLeftToday, dayIndex, weekNumber } from "./commun";
import { spend } from "./finances";
import { energyMax, currentHome } from "./logement";
import { isRevealed, acted } from "./revelations";

// La vie : l'énergie ne sert qu'à tes mains. Tu manges, tu dînes avec tes amis, Maman appelle le dimanche.
// Déléguer une corvée (les repas) est neutre ; déléguer un lien (Maman) ou le perdre (les amis) creuse le Sens.

export function tickEnergy(s: GameState, t: number): void {
  s.energy = Math.min(energyMax(s), s.energy + FL_ENERGY_REGEN * t);
}

/** Chaque matin : les repas du jour, et le repas livré s'il y en a un. */
export function lifeNewDay(s: GameState): void {
  const f = s.freelance;
  f.mealsToday = 0;
  if (f.delivery) {
    s.energy = Math.min(energyMax(s), s.energy + currentHome(s).meal);
    spend(s, MEAL_PRICE, "repas");
    f.ledger.repasCount += 1;
  }
}

/** « Ton repos : +N énergie / min », comme « Le lave-vaisselle te rapporte » au plongeur. */
export function restPerMin(s: GameState): number {
  const meals = s.freelance.delivery ? (currentHome(s).meal * 60) / FL_DAY_SECS : 0;
  return Math.round(FL_ENERGY_REGEN * 60 + meals);
}

// --- Les repas ---

export function canEat(s: GameState): boolean {
  return s.job === "freelance" && handsFree(s) && s.freelance.mealsToday < MEALS_PER_DAY && s.energy < energyMax(s);
}
export function eat(s: GameState): boolean {
  if (!canEat(s)) return false;
  s.energy = Math.min(energyMax(s), s.energy + currentHome(s).meal);
  s.freelance.mealsToday += 1;
  s.freelance.mealsCooked += 1;
  acted(s);
  return true;
}
export const deliveryOffered = (s: GameState): boolean => isRevealed(s, "livraison") && !s.freelance.delivery;
export function acceptDelivery(s: GameState): boolean {
  if (!deliveryOffered(s)) return false;
  s.freelance.delivery = true;
  acted(s);
  return true;
}

// --- Les amis, le vendredi ---

export function startDinner(s: GameState): void {
  const f = s.freelance;
  if (!f.friends || dayIndex(s) < FIRST_DINNER_DAY) return;
  f.dinnerOpen = true;
  f.dinnerInvites += 1;
}
/** Samedi matin : le dîner d'hier a eu lieu sans toi. */
export function endDinner(s: GameState): void {
  const f = s.freelance;
  if (!f.dinnerOpen) return;
  f.dinnerOpen = false;
  f.friendsMissed += 1;
  remember(s, "lien", TEXTES.dinnerMissed, true, DAY_NAMES[FRIDAY]);
  if (f.friendsMissed >= FRIENDS_MAX_MISSES) {
    f.friends = false;
    f.liensPerdus += 1;
    remember(s, "lien", TEXTES.friendsGone, true, DAY_NAMES[FRIDAY]);
  }
}
export const canGoToDinner = (s: GameState): boolean => s.freelance.dinnerOpen && handsFree(s);
export function goToDinner(s: GameState): boolean {
  if (!canGoToDinner(s)) return false;
  const f = s.freelance;
  f.dinnerOpen = false;
  f.busy = secsLeftToday(s);
  f.busyWhy = "diner";
  s.energy = Math.min(energyMax(s), s.energy + DINNER_ENERGY);
  f.dinners += 1;
  f.friendsMissed = 0;
  remember(s, "lien", TEXTES.dinnerWent, false);
  acted(s);
  return true;
}

// --- Maman, le dimanche ---

export function startSunday(s: GameState): void {
  const f = s.freelance;
  if (f.mamanIA) {
    remember(s, "lien", TEXTES.mamanByAI, true);
    return;
  }
  f.mamanRing = true;
  f.mamanRings += 1;
}
/** Lundi matin : un appel resté sans réponse laisse un message vocal (daté du dimanche). */
export function endSunday(s: GameState): void {
  const f = s.freelance;
  if (!f.mamanRing) return;
  f.mamanRing = false;
  remember(s, "lien", TEXTES.mamanMissed, true, DAY_NAMES[SUNDAY]);
}
export const canAnswerMaman = (s: GameState): boolean => s.freelance.mamanRing && handsFree(s);
export function answerMaman(s: GameState): boolean {
  if (!canAnswerMaman(s)) return false;
  const f = s.freelance;
  f.mamanRing = false;
  f.mamanCalls += 1;
  f.busy = secsLeftToday(s);
  f.busyWhy = "maman";
  s.energy = energyMax(s);
  remember(s, "lien", MAMAN_LINES[(f.mamanCalls - 1) % MAMAN_LINES.length], false);
  acted(s);
  return true;
}
export const mamanIAOffered = (s: GameState): boolean =>
  isRevealed(s, "maman_ia") && !s.freelance.mamanIA && s.freelance.mamanRing;
/** L'IA répond à Maman à ta place : gratuit, célébré, jamais commenté. Le lien est délégué. */
export function acceptMamanIA(s: GameState): boolean {
  if (!mamanIAOffered(s)) return false;
  const f = s.freelance;
  f.mamanIA = true;
  f.mamanRing = false;
  s.vieAutomatiseeCount += 1;
  remember(s, "lien", TEXTES.mamanByAI, true);
  acted(s);
  return true;
}

// --- Les sorties, un mercredi sur deux ---

export function startOuting(s: GameState): void {
  if (weekNumber(s) % 2 === 0) s.freelance.outingOpen = true;
}
export function endOuting(s: GameState): void {
  s.freelance.outingOpen = false;
}
export const currentOuting = (s: GameState): (typeof OUTINGS)[number] => OUTINGS[s.freelance.outings % OUTINGS.length];
export const canGoOut = (s: GameState): boolean => s.freelance.outingOpen && handsFree(s);
export function goOut(s: GameState): boolean {
  if (!canGoOut(s)) return false;
  const f = s.freelance;
  const o = currentOuting(s);
  spend(s, o.price, "sorties");
  f.outingOpen = false;
  f.busy = secsLeftToday(s);
  f.busyWhy = "sortie";
  s.energy = Math.min(energyMax(s), s.energy + OUTING_ENERGY);
  f.outings += 1;
  remember(s, "contemplation", o.souvenir, false);
  acted(s);
  return true;
}
