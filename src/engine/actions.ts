import { D, type Decimal } from "./numbers";
import { ENERGY_MAX, REST_ENERGY, type GameState } from "./state";
import { costOf, energyFactor } from "./economy";
import { GENERATORS, GENERATORS_BY_ID } from "./content/generators";
import { UPGRADES_BY_ID, type UpgradeDef } from "./content/upgrades";
import { JOBS, nextPromotion } from "./content/career";
import { nextBook, studiesComplete } from "./content/studies";
import { nextHome } from "./content/homes";
import {
  FOLLOWERS_PER_POST,
  FOLLOWER_PACK_BASE_COST,
  FOLLOWER_PACK_GROWTH,
  FOLLOWER_PACK_SIZE,
  SENS_PER_AUTOMATION,
  SENS_PER_REST,
} from "./content/audience";

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
    return;
  }
  if (state.job === "celebrite") {
    state.followers = state.followers.add(D(FOLLOWERS_PER_POST).mul(energyFactor(state)));
    state.energy = Math.max(0, state.energy - job.clickEnergyCost);
    state.totalClicks += 1;
    return;
  }
  // Managers (lead dev, CTO, fondateur) : pas de clic pour gagner de l'argent.
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
  return costOf(def.baseCost, def.growth, owned);
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
  if (def.grantCash) state.money = state.money.add(def.grantCash);
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
  if (state.flags.sensRevealed) state.sens = Math.min(100, state.sens + SENS_PER_REST);
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

function promotionReady(state: GameState, promo: { moneyThreshold: Decimal; followersThreshold?: Decimal }): boolean {
  return promo.followersThreshold
    ? state.followers.gte(promo.followersThreshold)
    : state.money.gte(promo.moneyThreshold);
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
  if (promo.to === "entrepreneur") state.flags.act2 = true; // bascule visuelle Acte II
  return true;
}
