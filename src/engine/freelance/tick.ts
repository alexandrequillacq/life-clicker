import type { GameState } from "../state";
import { dayIndex } from "./commun";
import { revealQueue } from "./revelations";
import { aiWrite, tickBugs, eveningBugs } from "./carnet";
import { mondayMorning } from "./finances";
import { trackPace, weeklyArrivals } from "./demande";
import { tickEnergy, lifeNewDay, startDinner, endDinner, startSunday, endSunday, startOuting, endOuting } from "./vie";

// Le temps qui passe au chapitre 2. Les tâches du plan insèrent leur code sous les repères entre crochets.

/** Un nouveau jour commence (`wd` : 0 = lundi). */
export function onNewDay(s: GameState, wd: number): void {
  // [nouveau jour]
  lifeNewDay(s);
  if (wd === 0) {
    // [lundi]
    endSunday(s); // l'appel d'hier, décroché ou non
    mondayMorning(s); // l'entretien, les charges pro, le loyer, le livret
    weeklyArrivals(s); // les commandes de la semaine
  }
  if (wd === 2) {
    // [mercredi]
    startOuting(s);
  }
  if (wd === 3) {
    // [jeudi]
    endOuting(s);
  }
  if (wd === 4) {
    // [vendredi]
    startDinner(s);
    if (s.freelance.evening) eveningBugs(s); // les commandes du soir amènent leurs bugs
  }
  if (wd === 5) {
    // [samedi]
    endDinner(s);
  }
  if (wd === 6) {
    // [dimanche]
    startSunday(s);
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
  tickEnergy(s, t);
  f.livretLow = Math.min(f.livretLow, f.livretBalance);
  tickBugs(s);
  aiWrite(s, t); // l'IA écrit, même quand tes mains sont prises
  trackPace(s, t);
  revealQueue(s);
  // [après le tick]
}
