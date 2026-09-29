import { createInitialState, type GameState } from "./state";
import { startFreelance } from "./freelance";

// Outil de test : lancer une partie neuve au début d'un chapitre précis (sélecteur en haut à droite).
// Chaque chapitre refait ce que le joueur aurait au moment d'y entrer, sans l'argent gagné avant.

export const CHAPTERS: { n: number; label: string }[] = [
  { n: 1, label: "1. Plongeur" },
  { n: 2, label: "2. Freelance" },
];

export function startAtChapter(n: number, now: number): GameState {
  const s = createInitialState(now);
  if (n >= 2) startFreelance(s);
  return s;
}
