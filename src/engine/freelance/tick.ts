import type { GameState } from "../state";
import { dayIndex } from "./commun";
import { revealQueue } from "./revelations";

// Le temps qui passe au chapitre 2. Les tâches du plan insèrent leur code sous les repères entre crochets.

/** Un nouveau jour commence (`wd` : 0 = lundi). */
export function onNewDay(s: GameState, wd: number): void {
  // [nouveau jour]
  if (wd === 0) {
    // [lundi]
  }
  if (wd === 2) {
    // [mercredi]
  }
  if (wd === 3) {
    // [jeudi]
  }
  if (wd === 4) {
    // [vendredi]
  }
  if (wd === 5) {
    // [samedi]
  }
  if (wd === 6) {
    // [dimanche]
  }
}

export function tickFreelance(s: GameState, t: number): void {
  const f = s.freelance;
  const before = dayIndex(s);
  f.day += t;
  const today = dayIndex(s);
  for (let d = before + 1; d <= today; d++) onNewDay(s, d % 7);
  if (f.busy > 0) {
    f.busy = Math.max(0, f.busy - t);
    if (f.busy === 0) f.busyWhy = "";
  }
  // [chaque tick]
  revealQueue(s);
  // [après le tick]
}
