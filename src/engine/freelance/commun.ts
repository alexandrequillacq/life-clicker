import type { GameState } from "../state";
import { FL_DAY_SECS, DAY_NAMES } from "../content/freelance";

// Petits outils partagés par tout le chapitre 2 : les euros, le calendrier, les mains, les souvenirs.

/** « 1 190 € », « −2 000 € » : des euros entiers, jamais « 1,2 k€ ». */
export function fmtEur(n: number): string {
  const r = Math.round(n);
  const digits = Math.abs(r).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${r < 0 ? "−" : ""}${digits} €`;
}

export const dayIndex = (s: GameState): number => Math.floor(s.freelance.day / FL_DAY_SECS);
/** 0 = lundi, 6 = dimanche. */
export const weekday = (s: GameState): number => dayIndex(s) % 7;
export const weekNumber = (s: GameState): number => Math.floor(dayIndex(s) / 7) + 1;
export const dayName = (s: GameState): string => DAY_NAMES[weekday(s)];
export const secsLeftToday = (s: GameState): number => FL_DAY_SECS - (s.freelance.day - dayIndex(s) * FL_DAY_SECS);

/** Tes mains sont libres (ni au téléphone, ni au dîner, ni sorti). */
export const handsFree = (s: GameState): boolean => s.freelance.busy <= 0;

/** Un souvenir, daté du jour (ou d'un autre : un dîner manqué se note le samedi matin, daté du vendredi).
 *  Un lien vécu nourrit le Sens ; un moment manqué ou délégué est gris. */
export function remember(s: GameState, kind: "lien" | "contemplation", text: string, missed: boolean, day = dayName(s)): void {
  s.souvenirs.unshift({ day, kind, text, missed });
  if (!missed) {
    s.vieVecueTicks += 1;
    s.secsSinceLife = 0;
  }
}
