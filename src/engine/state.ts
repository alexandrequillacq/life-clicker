import { D, type Decimal, ZERO } from "./numbers";
import { MISSION_PERIOD } from "./content/missions";
import { BADBUZZ_OFFSET } from "./content/audience";
import { START_COVERS, START_PILE } from "./content/plonge";

export const SAVE_VERSION = 10;

/** Constantes d'énergie (tunables au playtest). */
export const ENERGY_MAX = 100;
export const ENERGY_REGEN_PER_SEC = 3; // récupération passive (toujours)
export const REST_ENERGY = 40; // « Se reposer » regagne ceci

/** Incidents (lead dev & CTO) : une équipe humaine sans IA subit des pannes périodiques. */
export const INCIDENT_PERIOD = 75; // secondes entre deux incidents (× incidentPeriodMult)
export const INCIDENT_MALUS = 0.5; // pendant un incident, le brut d'équipe est multiplié par ceci
export const INCIDENT_ENERGY_COST = 10; // énergie dépensée pour « Résoudre l'incident » (action active)
export const INCIDENT_AUTO_RESOLVE = 40; // sans intervention, l'incident s'éteint seul au bout de ceci

/** Meeting politique (Acte III) : convertit une part des followers en Emprise, avec un cooldown propre. */
export const MEETING_COOLDOWN = 15; // secondes entre deux meetings
export const MEETING_SHARE = 0.02; // 2 % des followers courants consommés (plancher MEETING_MIN_FOLLOWERS)
export const MEETING_MIN_FOLLOWERS = 10_000; // consommation plancher ET seuil minimal pour tenir un meeting
export const MEETING_RATE = 0.002; // Emprise créée par follower consommé
export const MEETING_ENERGY_COST = 6; // énergie dépensée par meeting (action active du joueur)

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

/** Un moment de vie perso : vécu (point plein) ou manqué (message vocal, rendez-vous raté). */
export interface Souvenir {
  day: string; // jour de la semaine où c'est arrivé
  kind: "lien" | "contemplation"; // un lien (Maman, plus tard Camille, Lou) ou un moment pour soi
  text: string;
  missed: boolean;
}

/** Chapitre 1 (plongeur) : tout l'état du restaurant, isolé du reste du jeu. */
export interface PlongeState {
  day: number; // secondes écoulées dans le calendrier du restaurant (un jour = DAY_SECS)
  pile: number; // assiettes sales en attente
  covers: number; // couverts par jour
  sundayOpen: boolean; // le restaurant ouvre-t-il le dimanche ?
  asksDone: number; // demandes au chef acceptées (index de la prochaine)
  lastAskAt: number; // heure de la dernière demande acceptée
  keptUp: number; // secondes de jours ouverts, depuis la dernière demande, où tu suis (moins d'une brassée d'assiettes sales)
  askShown: boolean; // la demande suivante est proposée (elle reste jusqu'au clic)
  behindToday: number; // secondes, un jour ouvert, où tu ne suis plus (plus de BEHIND_LOADS brassées)
  overflowToday: number; // assiettes lavées par le chef aujourd'hui
  chefBefore: string; // réplique à retrouver quand le débordement se résorbe
  serviceCall: boolean; // Maman a appelé un dimanche ouvert (en plein service)
  mealsToday: number; // repas faits aujourd'hui
  revealed: Record<string, number>; // nouveautés révélées → temps de calendrier (une information à la fois)
  lastNovelty: number; // temps de la dernière nouveauté affichée
  emptyFor: number; // secondes de pile vide d'affilée (le bouton ne dit « Aucune assiette sale » qu'au-delà d'un instant)
  overflow: number; // assiettes lavées par le chef faute de place (perdues pour le joueur)
  overflowDay: number; // dernier jour où le débordement a été signalé
  washed: number; // assiettes lavées au total
  earned: number; // € gagnés au total à la plonge
  equipment: Record<string, boolean>; // objets uniques achetés
  boughtAt: Record<string, number>; // temps de calendrier de chaque achat (révélations différées)
  oldRate: number; // vieille machine réparée (assiettes/s, 0 si en panne)
  oldMult: number; // réglages de la vieille machine (joint, panier, détartrage)
  proRate: number; // lave-vaisselle pro, un ou deux (assiettes/s)
  machineMult: number; // réglages de toutes les machines (l'adoucisseur)
  clickBase: number; // assiettes par clic données par l'équipement (avant la concession « approximative »)
  concessions: Record<string, boolean>; // concessions acceptées (approximatif, cycle court, sans relavage)
  livret: boolean; // livret A ouvert
  livretBalance: number; // € sur le livret
  livretLow: number; // plus petit solde du livret depuis lundi (c'est lui qui rapporte)
  lastInterest: number; // € versés au dernier lundi
  loadClock: number; // secondes de vieux lave-vaisselle dans la fournée courante
  loads: number; // fournées terminées en cycle court
  relaunchLeft: number; // secondes restantes du relavage d'une fournée grasse (le vieux ne sort rien)
  complaint: boolean; // une plainte de client arrivera au service suivant
  callRing: number; // secondes restantes où Maman sonne (0 = pas d'appel)
  callTalk: number; // secondes restantes au téléphone (les mains s'arrêtent, pas les machines)
  callWeek: number; // dernière semaine où Maman a appelé
  callDay: string; // jour de l'appel en cours (le souvenir garde ce jour, même si l'appel finit à minuit)
  callsAnswered: number; // appels de Maman décrochés
  rings: number; // dimanches où Maman a appelé
  idle: number; // secondes sans aucune action du joueur
  windowDay: number; // dernier jour où l'on a regardé par la fenêtre
  windowCount: number; // nombre de fois (fait tourner les lignes)
  library: Record<string, number>; // études achetées → étapes faites
  chef: string; // id de la dernière réplique du chef (CHEF_LINES)
}

export function createPlongeState(): PlongeState {
  return {
    day: 0,
    pile: START_PILE,
    covers: START_COVERS,
    sundayOpen: false,
    asksDone: 0,
    lastAskAt: -1e6,
    keptUp: 0,
    askShown: false,
    behindToday: 0,
    emptyFor: 0,
    revealed: {},
    lastNovelty: -1000, // la première nouveauté n'attend personne
    overflowToday: 0,
    chefBefore: "debut",
    serviceCall: false,
    mealsToday: 0,
    overflow: 0,
    overflowDay: -1,
    washed: 0,
    earned: 0,
    equipment: {},
    boughtAt: {},
    oldRate: 0,
    oldMult: 1,
    proRate: 0,
    machineMult: 1,
    clickBase: 1,
    concessions: {},
    livret: false,
    livretBalance: 0,
    livretLow: 0,
    lastInterest: 0,
    loadClock: 0,
    loads: 0,
    relaunchLeft: 0,
    complaint: false,
    callRing: 0,
    callTalk: 0,
    callWeek: -1,
    callDay: "",
    callsAnswered: 0,
    rings: 0,
    idle: 0,
    windowDay: -1,
    windowCount: 0,
    library: {},
    chef: "debut",
  };
}

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
  plonge: PlongeState; // chapitre 1 : le restaurant, la pile, les machines, la bibliothèque
  souvenirs: Souvenir[]; // la vie perso vécue (ou manquée), la plus récente en tête
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
  maxFollowers: Decimal; // pic historique de followers (porte la gate politique ; jamais rongé par le bad buzz)
  followerPacks: number; // nombre de paquets de followers achetés (coût croissant)
  // Keynotes (fondateur) : action armée qui booste les produits et fait parler la presse.
  keynoteTimer: number; // secondes avant la prochaine keynote disponible (0 = prête)
  keynoteBoostLeft: number; // secondes de boost produits restantes
  // Célébrité : tendances (fenêtre ×8) et bad buzz (polémique qui draine le stock).
  trendTimer: number; // position dans le cycle de tendance [0, TREND_PERIOD)
  badBuzz: { timeLeft: number } | null; // polémique en cours (null = aucune)
  badBuzzTimer: number; // secondes avant la prochaine polémique
  sens: number; // 0..100, révélé en P5 ; reflète la vie vécue vs sacrifiée
  vieVecueTicks: number; // nombre de gestes de vie réels posés (alimente le Sens)
  vieAutomatiseeCount: number; // nombre d'automatisations de la vie achetées (creuse le Sens)
  secsSinceLife: number; // secondes écoulées depuis le dernier geste de vie
  emprise: Decimal; // Acte III : emprise sur le monde puis le cosmos (compteur de sortie, jamais une monnaie)
  acteCooldown: number; // secondes restantes avant le prochain acte de pouvoir
  acteCounts: Record<string, number>; // actes de pouvoir accomplis, par métier (« 3 alliances », « 4 lois »…)
  meetingCooldown: number; // secondes restantes avant le prochain meeting politique
  controls: Record<string, boolean>; // damiers de contrôle (institutions président, continents monde) : one-shot
  resistance: number; // 0..100 : la contestation que le contrôle appelle (draine l'Emprise/s), figée à 0 en empereur
  probes: Decimal; // empereur : sondes von Neumann auto-répliquantes (croissance composée)
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
    plonge: createPlongeState(),
    souvenirs: [],
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
    maxFollowers: ZERO,
    followerPacks: 0,
    keynoteTimer: 0,
    keynoteBoostLeft: 0,
    trendTimer: 0,
    badBuzz: null,
    badBuzzTimer: BADBUZZ_OFFSET,
    sens: 0,
    vieVecueTicks: 0,
    vieAutomatiseeCount: 0,
    secsSinceLife: 0,
    emprise: ZERO,
    acteCooldown: 0,
    acteCounts: {},
    meetingCooldown: 0,
    controls: {},
    resistance: 0,
    probes: ZERO,
    karma,
    flags: {},
    tempo: 1,
    startedAt: now,
    lastSeen: now,
    totalClicks: 0,
  };
}
