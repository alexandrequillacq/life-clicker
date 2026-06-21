import { type Decimal } from "./numbers";
import type { GameState } from "./state";
import { costOf } from "./economy";
import { GENERATORS_BY_ID } from "./content/generators";

export function clickWork(state: GameState): void {
  state.money = state.money.add(state.perClick);
  state.totalClicks += 1;
}

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
