// Missions freelance (développeur) : une fenêtre déterministe pour livrer N bugs contre une prime.
// Zéro RNG : période fixe, fenêtre fixe, palier fonction des missions déjà livrées.

export const MISSION_PERIOD = 45; // secondes entre deux missions (décompte dès 10 bugs résolus)
export const MISSION_WINDOW = 30; // secondes pour livrer une mission une fois ouverte
export const MISSION_MIN_BUGS = 10; // bugs résolus requis pour que les missions commencent à arriver

export interface MissionDef {
  label: string; // CTA / intitulé de la mission
  bugs: number; // bugs à résoudre dans la fenêtre
  prime: number; // € versés à la livraison
}

export const MISSIONS: MissionDef[] = [
  { label: "Livrer un site vitrine", bugs: 10, prime: 25 },
  { label: "Livrer une appli mobile", bugs: 15, prime: 60 },
  { label: "Livrer une migration legacy", bugs: 20, prime: 150 },
];

/** Palier proposé : monte avec les missions déjà livrées, plafonné au dernier. */
export function missionTier(missionsDone: number): number {
  return Math.min(missionsDone, MISSIONS.length - 1);
}
