import { D, type Decimal, ZERO } from "./numbers";

export const SAVE_VERSION = 2;

/** Constantes d'énergie (tunables au playtest). */
export const ENERGY_MAX = 100;
export const ENERGY_REGEN_PER_SEC = 3; // récupération passive (toujours)
export const ENERGY_DRAIN_PER_DISH = 0.5; // énergie dépensée par assiette lavée à la main en continu
export const REST_ENERGY = 40; // « Se reposer » regagne ceci

// Le clic reste à pleine valeur (effort ponctuel délibéré) ; seul le lavage
// CONTINU à la main dépense de l'énergie, proportionnellement aux assiettes
// lavées. Comme le débit baisse avec l'énergie, la dépense baisse aussi :
// l'énergie se stabilise à un palier soutenable au lieu de tomber à zéro.

export type Job = "plongeur" | "bureau";

export interface GameState {
  version: number;
  money: Decimal;
  valuePerDish: Decimal; // € par assiette
  dishesPerClick: number; // assiettes lavées par clic manuel
  handRate: number; // assiettes/s en continu à la main (0 tant que non débloqué)
  handWashing: boolean; // le lavage continu à la main est-il débloqué
  manualRetired: boolean; // gants posés → plus aucun travail manuel à la plonge
  energy: number; // 0..ENERGY_MAX
  generators: Record<string, number>; // machines (lave-vaisselle…), id → quantité
  upgrades: Record<string, boolean>; // upgrades one-shot achetés
  studyLevel: number; // livres lus → progrès vers un vrai métier
  job: Job; // métier courant
  flags: Record<string, boolean>; // déblocages d'UI (révélation progressive)
  tempo: number;
  startedAt: number;
  lastSeen: number;
  totalClicks: number;
}

export function createInitialState(now: number): GameState {
  return {
    version: SAVE_VERSION,
    money: ZERO,
    valuePerDish: D(0.05),
    dishesPerClick: 1,
    handRate: 0,
    handWashing: false,
    manualRetired: false,
    energy: ENERGY_MAX,
    generators: {},
    upgrades: {},
    studyLevel: 0,
    job: "plongeur",
    flags: {},
    tempo: 1,
    startedAt: now,
    lastSeen: now,
    totalClicks: 0,
  };
}
