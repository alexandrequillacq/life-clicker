import type { GameState } from "../state";

// Petits outils partagés par tous les modules du plongeur (formats, téléphone, inactivité, dates).

export const fmtRate = (n: number): string => (Math.round(n * 10) / 10).toString().replace(".", ",");
export const fmtEuros = (n: number): string => `${n.toFixed(2).replace(".", ",")} €`;

/** Toute action du joueur remet à zéro le compteur d'inactivité (la fenêtre ne s'offre qu'au repos). */
export function markAction(s: GameState): void {
  s.plonge.idle = 0;
}

/** Au téléphone avec Maman : tout s'arrête. */
export function onThePhone(s: GameState): boolean {
  return s.plonge.callTalk > 0;
}
export function callOngoing(s: GameState): boolean {
  return s.plonge.callRing > 0 || s.plonge.callTalk > 0;
}
export function handsBusy(s: GameState): boolean {
  return s.manualRetired || s.plonge.callTalk > 0;
}
