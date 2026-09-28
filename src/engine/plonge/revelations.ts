import type { GameState } from "../state";
import {
  PILE_VISIBLE_AT,
  CHEF_REVEAL_DELAY,
  SUNDAY_OFFER_DELAY,
  LIVRET_DELAY,
  NOVELTY_GAP,
  LIVRET_WITHOUT_SUNDAY,
  PRO_OFFER_DELAY,
  MEAL_REVEAL_DELAY,
} from "../content/plonge";
import { isRevealed, since, callOngoing } from "./commun";

// Ce qui est révélé : une information à la fois.

/** L'écran vient de changer par une action du joueur : les révélations suivantes attendent. */
export function novelty(s: GameState): void {
  s.plonge.lastNovelty = s.plonge.day;
}
function noveltyFree(s: GameState): boolean {
  return s.plonge.day >= s.plonge.lastNovelty + NOVELTY_GAP;
}
/** Révèle `key` si c'est prêt et qu'aucune autre nouveauté n'est trop récente. */
export function tryReveal(s: GameState, key: string, ready: boolean): boolean {
  if (isRevealed(s, key)) return true;
  if (!ready || !noveltyFree(s)) return false;
  s.plonge.revealed[key] = s.plonge.day;
  novelty(s);
  return true;
}
/** La file des nouveautés que le jeu révèle de lui-même, dans l'ordre, une à la fois. */
export function revealQueue(s: GameState): void {
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
