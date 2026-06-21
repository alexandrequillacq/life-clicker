import type { GameState } from "./state";
import { production } from "./economy";
import { GENERATORS } from "./content/generators";

export function updateFlags(state: GameState): void {
  if (!state.flags.moneyVisible && (state.totalClicks > 0 || state.money.gt(0))) {
    state.flags.moneyVisible = true;
  }
  for (const g of GENERATORS) {
    const flag = `gen_${g.id}_unlocked`;
    if (!state.flags[flag] && state.money.gte(g.unlockAtMoney)) {
      state.flags[flag] = true;
    }
  }
}

export function tick(state: GameState, dt: number): void {
  const scaled = dt * state.tempo;
  state.money = state.money.add(production(state).mul(scaled));
  updateFlags(state);
}
