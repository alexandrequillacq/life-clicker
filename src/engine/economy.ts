import { D, ZERO, type Decimal } from "./numbers";
import { ENERGY_MAX, type GameState } from "./state";
import { GENERATORS_BY_ID } from "./content/generators";

export function costOf(base: Decimal, growth: number, owned: number, count = 1): Decimal {
  const g = D(growth);
  const first = base.mul(g.pow(owned));
  if (count <= 1) return first;
  const factor = g.pow(count).sub(1).div(g.sub(1));
  return first.mul(factor);
}

/** Fraction 0..1 qui module le travail MANUEL. Vaut 1 tant que l'énergie n'est pas en jeu. */
export function energyFactor(state: GameState): number {
  if (!state.flags.energyVisible) return 1;
  return Math.max(0, state.energy) / ENERGY_MAX;
}

/** Assiettes/s lavées à la main en continu, modulé par l'énergie. */
export function handDishesPerSec(state: GameState): number {
  if (state.manualRetired || !state.handWashing) return 0;
  return state.handRate * energyFactor(state);
}

/** Assiettes/s produites par les machines (indépendant de l'énergie). */
export function machineDishesPerSec(state: GameState): Decimal {
  let total = ZERO;
  for (const id in state.generators) {
    const def = GENERATORS_BY_ID[id];
    if (!def) continue;
    total = total.add(def.dishesPerSec.mul(state.generators[id]));
  }
  return total;
}

/** Débit total en assiettes/s (machines + main). */
export function dishesPerSec(state: GameState): Decimal {
  return machineDishesPerSec(state).add(handDishesPerSec(state));
}

/** Débit affiché en assiettes/min. */
export function dishesPerMinute(state: GameState): Decimal {
  return dishesPerSec(state).mul(60);
}

/** Revenu en €/s. */
export function incomePerSec(state: GameState): Decimal {
  return dishesPerSec(state).mul(state.valuePerDish);
}
