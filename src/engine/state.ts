import { D, type Decimal, ZERO } from "./numbers";
import { MISSION_PERIOD } from "./content/missions";

export const SAVE_VERSION = 6;

/** Constantes d'énergie (tunables au playtest). */
export const ENERGY_MAX = 100;
export const ENERGY_REGEN_PER_SEC = 3; // récupération passive (toujours)
export const ENERGY_DRAIN_PER_DISH = 0.5; // énergie dépensée par assiette lavée à la main en continu
export const REST_ENERGY = 40; // « Se reposer » regagne ceci

/** Incidents (lead dev & CTO) : une équipe humaine sans IA subit des pannes périodiques. */
export const INCIDENT_PERIOD = 75; // secondes entre deux incidents (× incidentPeriodMult)
export const INCIDENT_MALUS = 0.5; // pendant un incident, le brut d'équipe est multiplié par ceci
export const INCIDENT_ENERGY_COST = 10; // énergie dépensée pour « Résoudre l'incident » (action active)
export const INCIDENT_AUTO_RESOLVE = 40; // sans intervention, l'incident s'éteint seul au bout de ceci

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
  // Développeur : compteur de bugs et missions freelance à fenêtre.
  bugsResolved: number; // bugs résolus au clic (débloque les missions à 10, gate lead à 40)
  missionsDone: number; // missions freelance livrées (détermine le palier proposé, gate lead à 2)
  mission: { tier: number; progress: number; timeLeft: number } | null; // mission courante (null = aucune)
  missionTimer: number; // secondes avant la prochaine mission (décompte quand bugsResolved >= 10)
  // Lead dev & CTO : incidents périodiques qui divisent le rendement de l'équipe humaine.
  incident: { timeLeft: number } | null; // incident courant (null = aucun)
  incidentTimer: number; // secondes avant le prochain incident
  incidentPeriodMult: number; // décision CTO : allonge (>1) ou raccourcit (<1) la période d'incident
  incidentAutoResolveSecs: number; // décision CTO : durée avant auto-extinction d'un incident
  // CTO : cartes de décision (effets déclaratifs permanents).
  decisionIndex: number; // index de la prochaine carte de décision (0..5)
  pendingDecision: boolean; // une carte est-elle en attente d'arbitrage ?
  ctoEarned: Decimal; // gains cumulés depuis l'entrée en poste de CTO (déclenche les cartes)
  teamOutputMult: number; // décisions : multiplicateur du brut d'équipe
  gpuCostMult: number; // décisions : multiplicateur du coût des GPU
  hireCostMult: number; // décisions : multiplicateur du coût des embauches
  gpuErosionMult: number; // décisions : multiplicateur de l'érosion du brut par GPU
  aiRateMult: number; // décisions : multiplicateur du débit de l'IA
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
    bugsResolved: 0,
    missionsDone: 0,
    mission: null,
    missionTimer: MISSION_PERIOD,
    incident: null,
    incidentTimer: INCIDENT_PERIOD,
    incidentPeriodMult: 1,
    incidentAutoResolveSecs: INCIDENT_AUTO_RESOLVE,
    decisionIndex: 0,
    pendingDecision: false,
    ctoEarned: ZERO,
    teamOutputMult: 1,
    gpuCostMult: 1,
    hireCostMult: 1,
    gpuErosionMult: 1,
    aiRateMult: 1,
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
