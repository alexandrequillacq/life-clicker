import { D, type Decimal } from "./numbers";
import {
  ENERGY_MAX,
  REST_ENERGY,
  INCIDENT_ENERGY_COST,
  INCIDENT_PERIOD,
  type GameState,
} from "./state";
import { costOf, energyFactor } from "./economy";
import { GENERATORS, GENERATORS_BY_ID } from "./content/generators";
import { UPGRADES_BY_ID, type UpgradeDef } from "./content/upgrades";
import { JOBS, LEAD_HIRING_BONUS, nextPromotion, type PromotionDef } from "./content/career";
import { MISSIONS, MISSION_PERIOD } from "./content/missions";
import { DECISIONS } from "./content/decisions";
import { nextBook, studiesComplete } from "./content/studies";
import { nextHome } from "./content/homes";
import { currentActe, ACTE_COOLDOWN } from "./content/power";
import {
  FOLLOWERS_PER_POST,
  POST_FOLLOWERS_SHARE,
  TREND_MULT,
  trendActive,
  BADBUZZ_ENERGY_COST,
  BADBUZZ_PERIOD,
  FOLLOWER_PACK_BASE_COST,
  FOLLOWER_PACK_GROWTH,
  FOLLOWER_PACK_SIZE,
  SENS_PER_AUTOMATION,
  SENS_PER_REST,
} from "./content/audience";
import {
  KEYNOTE_PERIOD,
  KEYNOTE_BOOST_SECS,
  KEYNOTE_FOLLOWERS,
  KEYNOTE_ENERGY_COST,
  PRESS_FOLLOWERS_RAISE,
  PRESS_FOLLOWERS_ACQUISITION,
} from "./content/keynote";

// --- Clic actif (dépend du métier) ---

/** Clic plonge : lave `dishesPerClick` assiettes à pleine valeur (effort ponctuel, sans énergie). */
export function clickWork(state: GameState): void {
  if (state.manualRetired) return;
  state.money = state.money.add(state.valuePerDish.mul(state.dishesPerClick));
  state.totalClicks += 1;
}

/**
 * Action active du métier courant.
 * Plongeur : lave (effort ponctuel, sans énergie). Développeur (IC) : résout un bug à pleine
 * valeur, mais l'énergie en limite la CADENCE (épuisé → se reposer), elle ne réduit jamais le gain.
 * Célébrité : publie (followers, modulé par l'énergie : la vanité fatigue). Managers : aucun clic
 * pour gagner de l'argent (revenu purement passif).
 */
export function work(state: GameState): void {
  if (state.job === "plongeur") {
    clickWork(state);
    return;
  }
  const job = JOBS[state.job];
  if (state.job === "developpeur") {
    if (state.energy < job.clickEnergyCost) return; // épuisé : il faut se reposer
    state.money = state.money.add(job.clickValue.mul(state.devClickMult));
    state.energy -= job.clickEnergyCost;
    state.totalClicks += 1;
    // Chaque bug résolu compte (débloque les missions, alimente la gate lead).
    state.bugsResolved += 1;
    // Mission en cours : le clic fait avancer la livraison ; à la cible, prime versée.
    if (state.mission) {
      state.mission.progress += 1;
      const def = MISSIONS[state.mission.tier];
      if (state.mission.progress >= def.bugs) {
        state.money = state.money.add(def.prime);
        state.missionsDone += 1;
        state.mission = null;
        state.missionTimer = MISSION_PERIOD;
      }
    }
    return;
  }
  if (state.job === "celebrite") {
    // Le post porte : base + part de l'audience, amplifié ×8 en tendance, modulé par l'énergie.
    const base = D(FOLLOWERS_PER_POST).add(state.followers.mul(POST_FOLLOWERS_SHARE));
    const trend = trendActive(state) ? TREND_MULT : 1;
    const gain = base.mul(trend).mul(energyFactor(state));
    state.followers = state.followers.add(gain);
    state.maxFollowers = state.maxFollowers.max(state.followers);
    state.energy = Math.max(0, state.energy - job.clickEnergyCost);
    state.totalClicks += 1;
    return;
  }
  // Managers (lead dev, CTO, fondateur) : pas de clic pour gagner de l'argent.
}

// --- Keynotes (fondateur) ---

/**
 * Une keynote est disponible pour le fondateur ayant bouclé au moins une levée, timer écoulé
 * et énergie suffisante (action ACTIVE du joueur → coût en énergie légitime).
 */
export function canGiveKeynote(state: GameState): boolean {
  return (
    state.job === "entrepreneur" &&
    !!state.upgrades["leve_amorcage"] &&
    state.keynoteTimer <= 0 &&
    state.energy >= KEYNOTE_ENERGY_COST
  );
}

/** Donner une keynote : +5 000 followers, boost produits armé 15 s, énergie −6, timer relancé à 60 s. */
export function giveKeynote(state: GameState): boolean {
  if (!canGiveKeynote(state)) return false;
  state.followers = state.followers.add(KEYNOTE_FOLLOWERS);
  state.maxFollowers = state.maxFollowers.max(state.followers);
  state.keynoteBoostLeft = KEYNOTE_BOOST_SECS;
  state.energy -= KEYNOTE_ENERGY_COST;
  state.keynoteTimer = KEYNOTE_PERIOD;
  return true;
}

// --- Bad buzz (célébrité) ---

/** Une polémique est en cours et le joueur a l'énergie pour la couper. */
export function canAnswerBadBuzz(state: GameState): boolean {
  return state.badBuzz !== null && state.energy >= BADBUZZ_ENERGY_COST;
}

/** Répondre à la polémique : action ACTIVE (8 énergie) qui coupe le drain et relance le timer. */
export function answerBadBuzz(state: GameState): boolean {
  if (state.badBuzz === null) return false;
  if (state.energy < BADBUZZ_ENERGY_COST) return false;
  state.energy -= BADBUZZ_ENERGY_COST;
  state.badBuzz = null;
  state.badBuzzTimer = BADBUZZ_PERIOD;
  return true;
}

// --- Audience (célébrité) ---

export function followerPackCost(state: GameState): Decimal {
  return D(FOLLOWER_PACK_BASE_COST).mul(D(FOLLOWER_PACK_GROWTH).pow(state.followerPacks));
}

export function canBuyFollowers(state: GameState): boolean {
  return state.money.gte(followerPackCost(state));
}

/** Acheter des followers : vanité manufacturée, mauvais ROI assumé. */
export function buyFollowers(state: GameState): boolean {
  const cost = followerPackCost(state);
  if (state.money.lt(cost)) return false;
  state.money = state.money.sub(cost);
  state.followers = state.followers.add(FOLLOWER_PACK_SIZE);
  state.followerPacks += 1;
  return true;
}

// --- Machines / générateurs ---

export function generatorCost(state: GameState, id: string): Decimal {
  const def = GENERATORS_BY_ID[id];
  const owned = state.generators[id] ?? 0;
  let cost = costOf(def.baseCost, def.growth, owned);
  // Décisions CTO : « Monter ses propres serveurs » (GPU) et « Standardiser l'outillage » (embauches).
  if (id === "gpu") cost = cost.mul(state.gpuCostMult);
  if (def.team) cost = cost.mul(state.hireCostMult);
  return cost;
}

export function canBuyGenerator(state: GameState, id: string): boolean {
  if (GENERATORS_BY_ID[id].team && state.flags.equipeRemplacee) return false; // équipe remplacée par l'IA : irréversible
  return state.money.gte(generatorCost(state, id));
}

export function buyGenerator(state: GameState, id: string): boolean {
  if (GENERATORS_BY_ID[id].team && state.flags.equipeRemplacee) return false;
  const def = GENERATORS_BY_ID[id];
  const cost = generatorCost(state, id);
  if (state.money.lt(cost)) return false;
  state.money = state.money.sub(cost);
  state.generators[id] = (state.generators[id] ?? 0) + 1;
  // Acquisition : on absorbe l'infra (des GPU s'ajoutent au parc).
  if (def.bonusGpu) state.generators["gpu"] = (state.generators["gpu"] ?? 0) + def.bonusGpu;
  // Presse : une acquisition fait parler de la boîte (pont fondateur → célébrité).
  if (id === "acquisition") {
    state.followers = state.followers.add(PRESS_FOLLOWERS_ACQUISITION);
    state.maxFollowers = state.maxFollowers.max(state.followers);
  }
  return true;
}

/** L'IA tourne et il reste des membres d'équipe (juniors/seniors) à remplacer (décision unique, irréversible). */
export function canFireTeam(state: GameState): boolean {
  if (!state.flags.aiResolving || state.flags.equipeRemplacee) return false;
  return GENERATORS.some((g) => g.team && (state.generators[g.id] ?? 0) > 0);
}

/** Remplacer toute l'équipe par l'IA : prime par tête (juniors et seniors), vide l'équipe, irréversible. */
export function fireTeam(state: GameState): boolean {
  if (!canFireTeam(state)) return false;
  for (const g of GENERATORS) {
    if (!g.team) continue;
    const n = state.generators[g.id] ?? 0;
    if (n > 0 && g.settlementPerHead) {
      state.money = state.money.add(D(g.settlementPerHead).mul(n));
    }
    state.generators[g.id] = 0;
  }
  state.flags.equipeRemplacee = true;
  return true;
}

// --- Lead dev & CTO : incidents ---

/** Un incident est en cours et le joueur a l'énergie pour l'éteindre. */
export function canResolveIncident(state: GameState): boolean {
  return state.incident !== null && state.energy >= INCIDENT_ENERGY_COST;
}

/**
 * Résoudre l'incident : action ACTIVE du joueur (coûte 10 énergie, cohérent avec la thèse).
 * Coupe l'incident et relance le timer. Refuse si aucun incident ou énergie insuffisante.
 */
export function resolveIncident(state: GameState): boolean {
  if (state.incident === null) return false;
  if (state.energy < INCIDENT_ENERGY_COST) return false;
  state.energy -= INCIDENT_ENERGY_COST;
  state.incident = null;
  state.incidentTimer = INCIDENT_PERIOD * state.incidentPeriodMult;
  return true;
}

// --- CTO : cartes de décision ---

/**
 * Trancher la carte de décision en attente : applique les effets déclaratifs de l'option choisie
 * (multiplicateurs cumulés, encaissement ou coût one-shot), puis avance la file.
 * « Payer la dette technique » refuse et laisse la carte en attente si la caisse ne suit pas.
 */
export function decide(state: GameState, choice: "A" | "B"): boolean {
  if (!state.pendingDecision) return false;
  const card = DECISIONS[state.decisionIndex];
  if (!card) return false;
  const eff = choice === "A" ? card.optionA : card.optionB;
  if (eff.cost !== undefined && state.money.lt(eff.cost)) return false; // carte laissée en attente
  if (eff.cost !== undefined) state.money = state.money.sub(eff.cost);
  if (eff.cash !== undefined) state.money = state.money.add(eff.cash);
  if (eff.teamOutputMult !== undefined) state.teamOutputMult *= eff.teamOutputMult;
  if (eff.gpuCostMult !== undefined) state.gpuCostMult *= eff.gpuCostMult;
  if (eff.hireCostMult !== undefined) state.hireCostMult *= eff.hireCostMult;
  if (eff.gpuErosionMult !== undefined) state.gpuErosionMult *= eff.gpuErosionMult;
  if (eff.aiRateMult !== undefined) state.aiRateMult *= eff.aiRateMult;
  if (eff.incidentPeriodMult !== undefined) state.incidentPeriodMult *= eff.incidentPeriodMult;
  if (eff.setIncidentAutoResolve !== undefined) state.incidentAutoResolveSecs = eff.setIncidentAutoResolve;
  state.decisionIndex += 1;
  state.pendingDecision = false;
  return true;
}

// --- Upgrades one-shot ---

export function upgradeAvailable(state: GameState, def: UpgradeDef): boolean {
  if (state.upgrades[def.id]) return false;
  if (def.requires && !state.upgrades[def.requires]) return false;
  if (def.phase === "plonge" && state.job !== "plongeur") return false;
  if (def.phase === "dev" && state.job === "plongeur") return false;
  if (def.phase === "biz" && state.job !== "entrepreneur") return false;
  return state.money.gte(def.unlockAtMoney);
}

export function canBuyUpgrade(state: GameState, id: string): boolean {
  return !state.upgrades[id] && state.money.gte(UPGRADES_BY_ID[id].cost);
}

export function buyUpgrade(state: GameState, id: string): boolean {
  if (state.upgrades[id]) return false;
  const def = UPGRADES_BY_ID[id];
  if (state.money.lt(def.cost)) return false;
  state.money = state.money.sub(def.cost);
  state.upgrades[id] = true;
  if (def.setDishesPerClick !== undefined) state.dishesPerClick = def.setDishesPerClick;
  if (def.unlocksHand) state.handWashing = true;
  if (def.setHandRate !== undefined) state.handRate = def.setHandRate;
  if (def.mulClickValue !== undefined) state.devClickMult *= def.mulClickValue;
  if (def.unlocksAi) state.flags.aiUnlocked = true;
  if (def.startsAi) state.flags.aiResolving = true;
  if (def.grantCash) {
    state.money = state.money.add(def.grantCash);
    // Presse : chaque levée bouclée fait parler de la boîte (pont fondateur → célébrité).
    state.followers = state.followers.add(PRESS_FOLLOWERS_RAISE);
    state.maxFollowers = state.maxFollowers.max(state.followers);
  }
  if (def.setGpuProductBoost !== undefined) state.gpuProductBoost = def.setGpuProductBoost;
  if (def.automatesLife) {
    state.flags.vieAutomatisee = true;
    state.vieAutomatiseeCount += 1;
    if (state.flags.sensRevealed) state.sens = Math.max(0, state.sens - SENS_PER_AUTOMATION);
  }
  return true;
}

// --- Bascule plonge & Vie ---

/** Poser les gants : stoppe tout le travail manuel à la plonge (clic + continu). */
export function poseGants(state: GameState): void {
  state.manualRetired = true;
  state.handWashing = false;
}

/** Se reposer / vivre : regagne de l'énergie, et compte comme un geste de vie réel (nourrit le Sens). */
export function rest(state: GameState): void {
  state.energy = Math.min(ENERGY_MAX, state.energy + REST_ENERGY);
  state.vieVecueTicks += 1;
  state.secsSinceLife = 0;
  // Le karma (vie préservée d'une vie passée) rend chaque geste de vie plus nourrissant.
  if (state.flags.sensRevealed) {
    state.sens = Math.min(100, state.sens + SENS_PER_REST + Math.min(5, state.karma));
  }
}

// --- Logement (décor de fond) ---

export function homeCost(state: GameState): Decimal | null {
  return nextHome(state.homeLevel)?.cost ?? null;
}

export function canBuyHome(state: GameState): boolean {
  const next = nextHome(state.homeLevel);
  return next !== null && state.money.gte(next.cost);
}

/** Acheter le logement suivant : débite le coût et monte d'un niveau de décor. */
export function buyHome(state: GameState): boolean {
  const next = nextHome(state.homeLevel);
  if (!next || state.money.lt(next.cost)) return false;
  state.money = state.money.sub(next.cost);
  state.homeLevel += 1;
  return true;
}

// --- Études & carrière ---

export function bookCost(state: GameState): Decimal | null {
  return nextBook(state.studyLevel)?.cost ?? null;
}

export function canStudy(state: GameState): boolean {
  const cost = bookCost(state);
  return cost !== null && state.money.gte(cost);
}

/** Lire le prochain livre : monte le niveau d'études. */
export function study(state: GameState): boolean {
  const cost = bookCost(state);
  if (cost === null || state.money.lt(cost)) return false;
  state.money = state.money.sub(cost);
  state.studyLevel += 1;
  return true;
}

export function canBecomeDeveloper(state: GameState): boolean {
  return state.job === "plongeur" && studiesComplete(state.studyLevel);
}

/** Postuler : on quitte la plonge (le revenu de plonge s'arrête) et on devient développeur. */
export function becomeDeveloper(state: GameState): boolean {
  if (!canBecomeDeveloper(state)) return false;
  state.job = "developpeur";
  state.flags.energyVisible = true; // le travail de dev sollicite l'énergie
  state.flags.firstColor = true; // récompense de fin d'Acte I : la 1ère couleur apparaît
  return true;
}

function promotionReady(state: GameState, promo: PromotionDef): boolean {
  // Toutes les conditions présentes se combinent en ET (les seuils absents sont neutres).
  if (state.money.lt(promo.moneyThreshold)) return false;
  // dev → lead : mérité par ce qu'on a FAIT dans la phase (bugs résolus ET missions livrées).
  if (promo.bugsThreshold !== undefined && state.bugsResolved < promo.bugsThreshold) return false;
  if (promo.missionsThreshold !== undefined && state.missionsDone < promo.missionsThreshold) return false;
  // cto → fondateur : toutes les décisions tranchées (le verbe du CTO est trancher).
  if (promo.decisionsThreshold !== undefined && state.decisionIndex < promo.decisionsThreshold) return false;
  // fondateur → célébrité : au moins une levée bouclée (pont narratif ET mécanique de la presse).
  if (promo.requiresUpgrade !== undefined && !state.upgrades[promo.requiresUpgrade]) return false;
  // célébrité → politique : porte sur le PIC historique, jamais le stock rongé par le bad buzz.
  if (promo.maxFollowersThreshold && state.maxFollowers.lt(promo.maxFollowersThreshold)) return false;
  // Acte III : promotions sur l'Emprise.
  if (promo.empriseThreshold && state.emprise.lt(promo.empriseThreshold)) return false;
  return true;
}

export function canPromote(state: GameState): boolean {
  const promo = nextPromotion(state.job);
  return promo !== null && promotionReady(state, promo);
}

/** Promotion vers le métier suivant (lead dev → CTO → fondateur → icône → politique). */
export function promote(state: GameState): boolean {
  const promo = nextPromotion(state.job);
  if (!promo || !promotionReady(state, promo)) return false;
  state.job = promo.to;
  // Prime d'embauche du lead : évite le hard-lock du lead sans revenu (finance les 1ers juniors).
  if (promo.to === "lead_dev") state.money = state.money.add(LEAD_HIRING_BONUS);
  if (promo.to === "entrepreneur") state.flags.act2 = true; // bascule visuelle Acte II
  if (promo.to === "politique") state.flags.act3 = true; // bascule visuelle Acte III (froid, dystopique)
  return true;
}

// --- Acte III : actes de pouvoir (seule prise du joueur) et épilogue ---

/** Un acte de pouvoir est disponible si la phase en a un et que le délai est écoulé. */
export function canActe(state: GameState): boolean {
  return currentActe(state.job) !== null && state.acteCooldown <= 0;
}

/** Autoriser un acte de pouvoir : saut d'Emprise instantané, puis délai (jamais de coût en énergie). */
export function fireActe(state: GameState): boolean {
  const acte = currentActe(state.job);
  if (!acte || state.acteCooldown > 0) return false;
  state.emprise = state.emprise.add(acte.empriseGrant);
  state.acteCooldown = ACTE_COOLDOWN;
  return true;
}

/** Choix d'épilogue : régner sur le vide (l'empire persiste, rien ne se passe). */
export function ruleTheVoid(state: GameState): void {
  state.flags.ending = true;
}
