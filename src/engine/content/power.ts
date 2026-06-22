import { D, type Decimal } from "../numbers";
import type { Job } from "../state";

// Acte III : le joueur n'a plus qu'un levier, l'acte de pouvoir. Il autorise, il ne travaille pas.
// Pas de coût en énergie (le pouvoir absolu ne fatigue pas) : seul un délai sépare deux actes.
export const ACTE_COOLDOWN = 45; // secondes entre deux actes de pouvoir

export interface ActeDef {
  label: string;
  empriseGrant: Decimal;
}

export const ACTES: Partial<Record<Job, ActeDef>> = {
  politique: { label: "Remporter l'élection", empriseGrant: D(2e4) },
  president: { label: "Faire passer une loi d'exception", empriseGrant: D(4e6) },
  monde: { label: "Annexer une région", empriseGrant: D(2e9) },
  empereur: { label: "Lancer la colonisation", empriseGrant: D(4e14) },
};

export function currentActe(job: Job): ActeDef | null {
  return ACTES[job] ?? null;
}

// Une seule ligne froide par phase (jamais de toast récurrent : le vide est silencieux).
export const VOID_LINES: Partial<Record<Job, string>> = {
  politique: "Tout le monde t'écoute. Tu ne parles à personne.",
  president: "Tu vois tout. Il n'y a plus rien à voir.",
  monde: "Le monde t'obéit. Le monde est vide.",
  empereur: "Tu as tout. Il ne reste personne pour le voir.",
};

// Seuil final (empereur cosmique) : au-delà, l'épilogue s'ouvre.
export const EPILOGUE_EMPRISE: Decimal = D(1e15);

// Karma gagné en renonçant : récompense la VIE préservée (le Sens), jamais l'Emprise amassée.
export function karmaGain(sens: number): number {
  return 1 + Math.floor(Math.max(0, sens) / 20); // 1 (Sens à 0) … 6 (Sens à 100)
}
