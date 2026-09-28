import type { GameState } from "../state";
import { LIBRARY, LIBRARY_BY_ID, type StudyItemDef } from "../content/plonge";
import { fmtRate, markAction, onThePhone } from "./commun";
import { openDayArrivalRate } from "./restaurant";
import { machineRate } from "./equipement";
import { novelty } from "./revelations";

// Poser les gants, la bibliothèque (le temps libre gagné en automatisant son travail), l'annonce.

// --- Poser les gants ---

export function canPoseGants(s: GameState): boolean {
  return s.job === "plongeur" && !s.manualRetired && !!s.plonge.equipment["pro"];
}
export function poseGantsEffects(s: GameState): string[] {
  return [
    `Tu arrêtes de laver. Les lave-vaisselle suivent seuls : ${fmtRate(machineRate(s))} assiettes / s pour ${fmtRate(openDayArrivalRate(s))} de vaisselle en moyenne.`,
    "Nouveau : tes études.",
  ];
}
/** Poser les gants : plus de travail manuel, place au temps libre (et à l'énergie qu'il demande). */
export function retireHands(s: GameState): void {
  s.manualRetired = true;
  s.flags.energyVisible = true;
  s.plonge.boughtAt["gants_poses"] = s.plonge.day;
  novelty(s);
  s.plonge.chef = "gants_poses";
  markAction(s);
}

// --- La bibliothèque ---

export function libraryVisible(s: GameState): boolean {
  return s.job === "plongeur" && s.manualRetired;
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
  return [`Coûte ${def.energy} énergie`, `${def.unit[0].toUpperCase()}${def.unit.slice(1)} : ${done} → ${done + def.perStep} sur ${total}`];
}
/** Sous-titre chiffré d'un achat d'étude : ce qu'il y a à faire, et ce que ça coûte en énergie. */
export function studyBuyEffects(def: StudyItemDef): string[] {
  const total = def.steps * def.perStep;
  const per = def.perStep > 1 ? `les ${def.perStep} ${def.unit}` : `par ${def.unit.replace(/s$/, "")}`;
  return [`${total} ${def.unit}, ${def.energy} énergie ${per}`];
}
export function studyProgress(s: GameState, def: StudyItemDef): { done: number; total: number } {
  return { done: (s.plonge.library[def.id] ?? 0) * def.perStep, total: def.steps * def.perStep };
}

// --- L'annonce ---

export const ANNONCE_EFFECTS = ["Tu quittes la plonge. Tu fais des sites, payés à la livraison."];
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
