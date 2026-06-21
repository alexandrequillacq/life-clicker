import { D, ZERO, type Decimal } from "./numbers";
import type { GameState } from "./state";
import { GENERATORS_BY_ID } from "./content/generators";

export function costOf(base: Decimal, growth: number, owned: number, count = 1): Decimal {
  const g = D(growth);
  const first = base.mul(g.pow(owned));
  if (count <= 1) return first;
  const factor = g.pow(count).sub(1).div(g.sub(1));
  return first.mul(factor);
}

export function production(state: GameState): Decimal {
  let total = ZERO;
  for (const id in state.generators) {
    const def = GENERATORS_BY_ID[id];
    if (!def) continue;
    total = total.add(def.baseOutput.mul(state.generators[id]));
  }
  return total;
}
