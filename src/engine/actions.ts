import { type Decimal } from "./numbers";
import { ENERGY_MAX, REST_ENERGY, type GameState } from "./state";
import { costOf } from "./economy";
import { GENERATORS_BY_ID } from "./content/generators";
import { UPGRADES_BY_ID, type UpgradeDef } from "./content/upgrades";
import {
  BOOK_BASE_COST,
  BOOK_GROWTH,
  OFFICE_VALUE_PER_CLICK,
  STUDY_THRESHOLD,
} from "./content/studies";

/** Clic plonge : lave `dishesPerClick` assiettes à pleine valeur (effort ponctuel, sans coût d'énergie). */
export function clickWork(state: GameState): void {
  if (state.manualRetired) return;
  state.money = state.money.add(state.valuePerDish.mul(state.dishesPerClick));
  state.totalClicks += 1;
}

// --- Machines (générateurs) ---

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
  return true;
}

// --- Bascule & Vie ---

/** Poser les gants : stoppe tout le travail manuel (clic + continu). */
export function poseGants(state: GameState): void {
  state.manualRetired = true;
  state.handWashing = false;
}

/** Se reposer : regagne de l'énergie (graine de l'axe Vie). */
export function rest(state: GameState): void {
  state.energy = Math.min(ENERGY_MAX, state.energy + REST_ENERGY);
}

// --- Études & changement de métier ---

export function bookCost(state: GameState): Decimal {
  return costOf(BOOK_BASE_COST, BOOK_GROWTH, state.studyLevel);
}

export function canStudy(state: GameState): boolean {
  return state.money.gte(bookCost(state));
}

/** Lire un livre : monte le niveau d'études. */
export function study(state: GameState): boolean {
  const cost = bookCost(state);
  if (state.money.lt(cost)) return false;
  state.money = state.money.sub(cost);
  state.studyLevel += 1;
  return true;
}

export function canBecomeOffice(state: GameState): boolean {
  return state.job === "plongeur" && state.studyLevel >= STUDY_THRESHOLD;
}

/** Postuler : on confie la plonge (qui tourne en automatique) et on passe employé de bureau. */
export function becomeOffice(state: GameState): boolean {
  if (!canBecomeOffice(state)) return false;
  state.job = "bureau";
  return true;
}

/** Clic bureau : traiter un dossier (bien plus rémunérateur qu'une assiette). */
export function processFile(state: GameState): void {
  if (state.job !== "bureau") return;
  state.money = state.money.add(OFFICE_VALUE_PER_CLICK);
  state.totalClicks += 1;
}
