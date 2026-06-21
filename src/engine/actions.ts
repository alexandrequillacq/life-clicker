import { type Decimal } from "./numbers";
import { ENERGY_MAX, REST_ENERGY, type GameState } from "./state";
import { costOf, energyFactor } from "./economy";
import { GENERATORS_BY_ID } from "./content/generators";
import { UPGRADES_BY_ID, type UpgradeDef } from "./content/upgrades";
import { JOBS, nextPromotion } from "./content/career";
import { nextBook, studiesComplete } from "./content/studies";

// --- Clic actif (dépend du métier) ---

/** Clic plonge : lave `dishesPerClick` assiettes à pleine valeur (effort ponctuel, sans énergie). */
export function clickWork(state: GameState): void {
  if (state.manualRetired) return;
  state.money = state.money.add(state.valuePerDish.mul(state.dishesPerClick));
  state.totalClicks += 1;
}

/** Action active du métier courant. Le plongeur lave ; les métiers dev coûtent de l'énergie. */
export function work(state: GameState): void {
  if (state.job === "plongeur") {
    clickWork(state);
    return;
  }
  const job = JOBS[state.job];
  const gained = job.clickValue.mul(state.devClickMult).mul(energyFactor(state));
  state.money = state.money.add(gained);
  state.energy = Math.max(0, state.energy - job.clickEnergyCost);
  state.totalClicks += 1;
}

// --- Machines / générateurs ---

export function generatorCost(state: GameState, id: string): Decimal {
  const def = GENERATORS_BY_ID[id];
  const owned = state.generators[id] ?? 0;
  return costOf(def.baseCost, def.growth, owned);
}

export function canBuyGenerator(state: GameState, id: string): boolean {
  return state.money.gte(generatorCost(state, id));
}

export function buyGenerator(state: GameState, id: string): boolean {
  const cost = generatorCost(state, id);
  if (state.money.lt(cost)) return false;
  state.money = state.money.sub(cost);
  state.generators[id] = (state.generators[id] ?? 0) + 1;
  return true;
}

// --- Upgrades one-shot ---

export function upgradeAvailable(state: GameState, def: UpgradeDef): boolean {
  if (state.upgrades[def.id]) return false;
  if (def.requires && !state.upgrades[def.requires]) return false;
  if (def.phase === "plonge" && state.job !== "plongeur") return false;
  if (def.phase === "dev" && state.job === "plongeur") return false;
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
  return true;
}

// --- Bascule plonge & Vie ---

/** Poser les gants : stoppe tout le travail manuel à la plonge (clic + continu). */
export function poseGants(state: GameState): void {
  state.manualRetired = true;
  state.handWashing = false;
}

/** Se reposer : regagne de l'énergie (graine de l'axe Vie). */
export function rest(state: GameState): void {
  state.energy = Math.min(ENERGY_MAX, state.energy + REST_ENERGY);
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
  return true;
}

export function canPromote(state: GameState): boolean {
  const promo = nextPromotion(state.job);
  return promo !== null && state.money.gte(promo.moneyThreshold);
}

/** Promotion vers le métier suivant (lead dev → CTO → fondateur). */
export function promote(state: GameState): boolean {
  const promo = nextPromotion(state.job);
  if (!promo || state.money.lt(promo.moneyThreshold)) return false;
  state.job = promo.to;
  return true;
}
