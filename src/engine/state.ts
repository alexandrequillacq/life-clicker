import { D, type Decimal, ZERO } from "./numbers";

export const SAVE_VERSION = 5;

/** Constantes d'énergie (tunables au playtest). */
export const ENERGY_MAX = 100;
export const ENERGY_REGEN_PER_SEC = 3; // récupération passive (toujours)
export const ENERGY_DRAIN_PER_DISH = 0.5; // énergie dépensée par assiette lavée à la main en continu
export const REST_ENERGY = 40; // « Se reposer » regagne ceci

// Le clic reste à pleine valeur (effort ponctuel délibéré) ; seul le lavage
// CONTINU à la main dépense de l'énergie, proportionnellement aux assiettes
// lavées. Comme le débit baisse avec l'énergie, la dépense baisse aussi :
// l'énergie se stabilise à un palier soutenable au lieu de tomber à zéro.

export type Job =
  | "plongeur"
  | "developpeur"
  | "lead_dev"
  | "cto"
  | "entrepreneur"
  | "celebrite"
  | "politique"
  | "president"
  | "monde"
  | "empereur";

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
  studyLevel: number; // index du prochain livre à lire (progrès vers développeur)
  homeLevel: number; // niveau de logement (décor de fond), du sous-sol à la villa
  job: Job; // métier courant
  devClickMult: number; // multiplicateur de valeur du clic (upgrades dev)
  gpuProductBoost: number; // boost par GPU sur la production des produits IA (data center le monte)
  followers: Decimal; // audience (célébrité) : vanité, revenu propre dérisoire
  followerPacks: number; // nombre de paquets de followers achetés (coût croissant)
  sens: number; // 0..100, révélé en P5 ; reflète la vie vécue vs sacrifiée
  vieVecueTicks: number; // nombre de gestes de vie réels posés (alimente le Sens)
  vieAutomatiseeCount: number; // nombre d'automatisations de la vie achetées (creuse le Sens)
  secsSinceLife: number; // secondes écoulées depuis le dernier geste de vie
  emprise: Decimal; // Acte III : emprise sur le monde puis le cosmos (compteur de sortie, jamais une monnaie)
  acteCooldown: number; // secondes restantes avant le prochain acte de pouvoir
  karma: number; // méta : préservé à travers la réincarnation, récompense la vie vécue
  flags: Record<string, boolean>; // déblocages d'UI (révélation progressive)
  tempo: number;
  startedAt: number;
  lastSeen: number;
  totalClicks: number;
}

export function createInitialState(now: number, karma = 0): GameState {
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
    homeLevel: 0,
    job: "plongeur",
    devClickMult: 1,
    gpuProductBoost: 0.1,
    followers: ZERO,
    followerPacks: 0,
    sens: 0,
    vieVecueTicks: 0,
    vieAutomatiseeCount: 0,
    secsSinceLife: 0,
    emprise: ZERO,
    acteCooldown: 0,
    karma,
    flags: {},
    tempo: 1,
    startedAt: now,
    lastSeen: now,
    totalClicks: 0,
  };
}
