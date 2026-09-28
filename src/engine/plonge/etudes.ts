import type { GameState } from "../state";
import { LIBRARY, LIBRARY_BY_ID, TEXTES, type StudyItemDef } from "../content/plonge";
import { fmtRate, onThePhone } from "./commun";
import { openDayArrivalRate } from "./restaurant";
import { machineRate } from "./equipement";
import { acted, isRevealed } from "./revelations";

// Poser les gants, la bibliothèque (le temps libre gagné en automatisant son travail), l'annonce.

// --- Poser les gants ---

export function canPoseGants(s: GameState): boolean {
  return s.job === "plongeur" && !s.manualRetired && isRevealed(s, "poser_gants");
}
export function poseGantsEffects(s: GameState): string[] {
  return [
    TEXTES.poseGants(fmtRate(machineRate(s)), fmtRate(openDayArrivalRate(s))),
    TEXTES.poseGantsStudies,
  ];
}
/** Poser les gants : plus de travail manuel, place au temps libre (et à l'énergie qu'il demande). */
export function retireHands(s: GameState): boolean {
  if (!canPoseGants(s) || onThePhone(s)) return false;
  s.manualRetired = true;
  s.flags.energyVisible = true;
  s.plonge.boughtAt["gants_poses"] = s.plonge.day;
  s.plonge.chef = "gants_poses";
  acted(s);
  return true;
}

// --- La bibliothèque ---

export function libraryVisible(s: GameState): boolean {
  return s.job === "plongeur" && isRevealed(s, "etudes");
}
function studyIndex(id: string): number {
  return LIBRARY.findIndex((l) => l.id === id);
}
export function studyDone(s: GameState, id: string): boolean {
  const def = LIBRARY_BY_ID[id];
  return !!def && (s.plonge.library[id] ?? 0) >= def.steps;
}
/** Les études s'achètent dans l'ordre, une fois la précédente achetée. */
export function studyBuyVisible(s: GameState, id: string): boolean {
  if (!libraryVisible(s) || id in s.plonge.library) return false;
  const def = LIBRARY_BY_ID[id];
  if (def.requiresDone && !studyDone(s, def.requiresDone)) return false;
  const i = studyIndex(id);
  return i === 0 || LIBRARY[i - 1].id in s.plonge.library;
}
export function canBuyStudy(s: GameState, id: string): boolean {
  const def = LIBRARY_BY_ID[id];
  return !!def && studyBuyVisible(s, id) && s.money.gte(def.cost) && !onThePhone(s);
}
export function buyStudy(s: GameState, id: string): boolean {
  if (!canBuyStudy(s, id)) return false;
  s.money = s.money.sub(LIBRARY_BY_ID[id].cost);
  s.plonge.library[id] = 0;
  s.plonge.boughtAt[id] = s.plonge.day;
  return true;
}
export function canStudyStep(s: GameState, id: string): boolean {
  const def = LIBRARY_BY_ID[id];
  return (
    !!def && libraryVisible(s) && id in s.plonge.library && !studyDone(s, id) && !onThePhone(s) && s.energy >= def.energy
  );
}
/** Avancer d'une étape (lire 20 pages, une séance…) : consomme l'énergie accumulée au repos. */
export function studyStep(s: GameState, id: string): boolean {
  if (!canStudyStep(s, id)) return false;
  s.energy -= LIBRARY_BY_ID[id].energy;
  s.plonge.library[id] += 1;
  return true;
}
/** Libellé de l'étape suivante (« Lire 20 pages », puis « Passer l'examen » pour la dernière). */
export function studyStepLabel(s: GameState, def: StudyItemDef): string {
  const done = s.plonge.library[def.id] ?? 0;
  return def.lastStep && done === def.steps - 1 ? def.lastStep : def.step;
}
/** Sous-titre chiffré d'une étape : ce qu'elle coûte et ce qu'elle fait avancer. */
export function studyStepEffects(s: GameState, def: StudyItemDef): string[] {
  const done = (s.plonge.library[def.id] ?? 0) * def.perStep;
  const total = def.steps * def.perStep;
  return [TEXTES.studyCost(def.energy), TEXTES.studyAdvance(def.unit, done, done + def.perStep, total)];
}
/** Sous-titre chiffré d'un achat d'étude : ce qu'il y a à faire, et ce que ça coûte en énergie. */
export function studyBuyEffects(def: StudyItemDef): string[] {
  return [TEXTES.studyBuy(def.steps * def.perStep, def.unit, def.energy, def.perStep)];
}
export function studyProgress(s: GameState, def: StudyItemDef): { done: number; total: number } {
  return { done: (s.plonge.library[def.id] ?? 0) * def.perStep, total: def.steps * def.perStep };
}

// --- L'annonce ---

export function examPassed(s: GameState): boolean {
  return studyDone(s, LIBRARY[LIBRARY.length - 1].id);
}
export function canAnswerAnnonce(s: GameState): boolean {
  return s.job === "plongeur" && examPassed(s) && !onThePhone(s);
}
/** Répondre à l'annonce de Mme Duval : on quitte la plonge, on devient développeur. */
export function answerAnnonce(s: GameState): boolean {
  if (!canAnswerAnnonce(s)) return false;
  s.job = "developpeur";
  s.flags.energyVisible = true; // le travail de dev sollicite l'énergie
  s.flags.firstColor = true; // récompense de fin d'Acte I : la première couleur apparaît
  s.plonge.chef = "annonce";
  return true;
}
