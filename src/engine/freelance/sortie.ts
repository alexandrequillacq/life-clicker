import type { GameState } from "../state";
import { EXIT_BUGS, NORA_BUGS_PER_DAY, FL_DAY_SECS, FRIDAY } from "../content/freelance";
import { bugsLast7Days, fixBug } from "./carnet";
import { weekday } from "./commun";
import { isRevealed, acted } from "./revelations";

// La sortie du chapitre 2 : la première embauche. Nora corrige les bugs à ta place, du lundi au vendredi.

export function exitReady(s: GameState): boolean {
  const f = s.freelance;
  if (f.nora) return false;
  const bugs = Math.max(bugsLast7Days(s), f.bugs.length);
  // Sans formation, pas de test rouge : le compromis ne peut pas se présenter, on ne l'attend pas.
  const compromisSeen = f.compromis !== "none" || f.tools.formation === undefined;
  return bugs >= EXIT_BUGS && f.subs.ia_mail !== undefined && isRevealed(s, "maman_ia") && compromisSeen;
}

export const noraOffered = (s: GameState): boolean => s.job === "freelance" && isRevealed(s, "nora") && !s.freelance.nora;

/** Embaucher Nora : rien à payer tout de suite ; 600 € chaque lundi, même en négatif (elle ne part jamais). */
export function hireNora(s: GameState): boolean {
  if (!noraOffered(s)) return false;
  s.freelance.nora = true;
  acted(s);
  return true;
}

/** Nora corrige, du lundi au vendredi, trois bugs par jour ; elle prend la file par la fin. */
export function tickNora(s: GameState, t: number): void {
  const f = s.freelance;
  if (!f.nora || weekday(s) > FRIDAY) return;
  f.noraAcc += (t * NORA_BUGS_PER_DAY) / FL_DAY_SECS;
  while (f.noraAcc >= 1 - 1e-9 && f.bugs.length > 0) {
    fixBug(s, f.bugs.length > 1 ? f.bugs[f.bugs.length - 1] : f.bugs[0]);
    f.noraAcc -= 1;
  }
  if (f.bugs.length === 0) f.noraAcc = Math.min(f.noraAcc, 1); // elle ne met pas de bugs de côté
}
