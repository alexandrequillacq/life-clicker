// Moteur du chapitre 2 (développeur freelance). Pur et déterministe. Tu construis des sites et tu les
// entretiens ; les bugs des sites entretenus passent en tête du carnet ; automatiser ton travail (les outils,
// l'IA, Nora) est sain et célébré ; automatiser ta vie (les repas, Maman) commence doucement.
// Tout le réglage vit dans ../content/freelance.ts.
import type { GameState } from "../state";
import { createFreelanceState } from "../state";
import { HOMES } from "../content/freelance";

export * from "./commun";
export * from "./finances";
export * from "./carnet";
export * from "./entreprise";
export * from "./revelations";
export * from "./demande";
export * from "./outils";
export * from "./logement";
export * from "./vie";
export * from "./compromis";
export * from "./tick";

/** Répondre à l'annonce de Mme Duval : le chapitre 2 commence un lundi, sur le canapé de Sam. */
export function startFreelance(s: GameState): void {
  s.job = "freelance";
  s.freelance = createFreelanceState();
  // Le livret du plongeur suit (même vie, même banque).
  s.freelance.livretBalance = s.plonge.livretBalance;
  s.freelance.livretLow = s.plonge.livretBalance;
  s.plonge.livretBalance = 0;
  s.flags.energyVisible = true;
  s.flags.moneyVisible = true;
  s.energy = Math.min(s.energy, HOMES[0].energyMax);
}
