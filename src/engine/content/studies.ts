import { D, type Decimal } from "../numbers";

export interface StudyDef {
  id: string;
  label: string;
  cost: Decimal;
}

// Suite de livres de complexité croissante pour devenir développeur.
// Logique : on étudie pour CHANGER de métier, pas pour mieux laver les assiettes.
export const STUDIES: StudyDef[] = [
  { id: "logique", label: "Initiation à la logique", cost: D(4) },
  { id: "html", label: "HTML & CSS", cost: D(8) },
  { id: "js", label: "JavaScript", cost: D(16) },
  { id: "algo", label: "Algorithmes & structures de données", cost: D(32) },
  { id: "archi", label: "Architecture logicielle", cost: D(60) },
];

/** Coût du prochain livre (null si tous lus). */
export function nextBook(studyLevel: number): StudyDef | null {
  return STUDIES[studyLevel] ?? null;
}

export function studiesComplete(studyLevel: number): boolean {
  return studyLevel >= STUDIES.length;
}
