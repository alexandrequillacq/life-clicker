import { ENERGY_MAX, type GameState } from "../state";
import { WINDOW_IDLE_SECS, MEAL_ENERGY, MEALS_PER_DAY, WINDOW_LINES, WINDOW_LINES_HOME, TEXTES } from "../content/plonge";
import { fmtEuros, markAction, onThePhone } from "./commun";
import { dayIndex, dayName, arrivalsIn, secsLeftToday } from "./restaurant";
import { machineOutput } from "./equipement";
import { lifeVisible, isRevealed } from "./revelations";
import { libraryVisible } from "./etudes";

// La vie perso : Maman au téléphone, la fenêtre, le repas, les souvenirs.

/** Un souvenir, daté du jour où il a eu lieu (un appel est daté du dimanche, même fini le lundi). */
export function remember(s: GameState, kind: "lien" | "contemplation", text: string, missed: boolean, day = dayName(s)): void {
  s.souvenirs.unshift({ day, kind, text, missed });
  s.vieVecueTicks += missed ? 0 : 1;
  if (!missed) s.secsSinceLife = 0;
}

// --- Maman ---

export function canAnswerCall(s: GameState): boolean {
  return s.plonge.callRing > 0;
}
/** Ce que coûte de décrocher : jusqu'à lundi, le chef lave ce que les machines ne suivent pas. */
function callLoss(s: GameState): number {
  if (s.manualRetired) return 0;
  const secs = secsLeftToday(s);
  const lost = arrivalsIn(s, secs) - machineOutput(s) * secs;
  return Math.max(0, lost) * s.valuePerDish.toNumber();
}
export function callEffects(s: GameState): string[] {
  const out = [TEXTES.callTalk];
  if (s.flags.energyVisible) out.push(TEXTES.callEnergy(Math.round(s.energy), ENERGY_MAX));
  const loss = callLoss(s);
  if (loss >= 0.01) out.push(TEXTES.callLoss(fmtEuros(loss)));
  return out;
}
/** Décrocher : les mains (et les études) s'arrêtent jusqu'à lundi ; les machines, elles, tournent. */
export function answerCall(s: GameState): boolean {
  if (!canAnswerCall(s)) return false;
  const p = s.plonge;
  p.callRing = 0;
  p.callTalk = secsLeftToday(s);
  p.callsAnswered += 1;
  p.boughtAt[`appel_${p.callsAnswered}`] = p.day;
  markAction(s);
  return true;
}

// --- La fenêtre ---

export function canLookOutWindow(s: GameState): boolean {
  return (
    s.job === "plongeur" &&
    lifeVisible(s) &&
    !onThePhone(s) &&
    s.plonge.idle >= WINDOW_IDLE_SECS &&
    s.plonge.windowDay !== dayIndex(s)
  );
}
export function lookOutWindow(s: GameState): boolean {
  if (!canLookOutWindow(s)) return false;
  s.plonge.windowDay = dayIndex(s);
  const lines = s.manualRetired ? WINDOW_LINES_HOME : WINDOW_LINES;
  remember(s, "contemplation", lines[s.plonge.windowCount % lines.length], false);
  s.plonge.windowCount += 1;
  markAction(s);
  return true;
}

// --- Les gestes de vie qui redonnent de l'énergie ---

export function mealVisible(s: GameState): boolean {
  return libraryVisible(s) && isRevealed(s, "repas");
}
export function canEat(s: GameState): boolean {
  return mealVisible(s) && s.plonge.mealsToday < MEALS_PER_DAY && s.energy < ENERGY_MAX && !onThePhone(s);
}
export function mealEffects(s: GameState): string[] {
  if (s.plonge.mealsToday >= MEALS_PER_DAY) return [TEXTES.mealDone];
  return [
    TEXTES.mealEnergy(Math.round(s.energy), Math.min(ENERGY_MAX, Math.round(s.energy + MEAL_ENERGY))),
    TEXTES.mealsPerDay(MEALS_PER_DAY),
  ];
}
/** Se faire à manger : une corvée de vie, qui recharge sans poser de souvenir. */
export function eat(s: GameState): boolean {
  if (!canEat(s)) return false;
  s.energy = Math.min(ENERGY_MAX, s.energy + MEAL_ENERGY);
  s.plonge.mealsToday += 1;
  return true;
}
