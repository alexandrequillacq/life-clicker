import type { GameState } from "../state";
import { HOMES, HOME_RENT_FACTOR, type HomeDef } from "../content/freelance";
import { remember } from "./commun";
import { isRevealed, acted } from "./revelations";

// Le logement : du canapé de Sam au deux-pièces avec un bureau. Payé chaque lundi, même en négatif.

export const currentHome = (s: GameState): HomeDef => HOMES[s.freelance.home];
export const energyMax = (s: GameState): number => currentHome(s).energyMax;
export const nextHome = (s: GameState): HomeDef | undefined => HOMES[s.freelance.home + 1];

/** Le logement n° i vaut-il la peine (pour la file) : c'est le suivant, et tes entrées couvrent 5 fois son loyer. */
export function homeWorthIt(s: GameState, i: number): boolean {
  const f = s.freelance;
  if (f.home !== i - 1) return false;
  const weeks = f.history.slice(-2);
  if (weeks.length === 0) return false;
  const avg = weeks.reduce((n, w) => n + w.entrees, 0) / weeks.length;
  return avg >= HOME_RENT_FACTOR * HOMES[i].rent;
}

export function homeOffered(s: GameState): HomeDef | undefined {
  const h = nextHome(s);
  return h && isRevealed(s, `home_${h.id}`) ? h : undefined;
}

export function moveHome(s: GameState): boolean {
  const h = homeOffered(s);
  if (!h || s.job !== "freelance") return false;
  const before = energyMax(s);
  s.freelance.home += 1;
  s.energy = Math.min(h.energyMax, s.energy + h.energyMax - before);
  remember(s, "lien", h.souvenir, false);
  acted(s);
  return true;
}
