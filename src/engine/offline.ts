import { ENERGY_MAX, ENERGY_REGEN_PER_SEC, type GameState } from "./state";
import { machineDishesPerSec } from "./economy";
import { type Decimal } from "./numbers";

export const OFFLINE_CAP_SECONDS = 4 * 3600;

/**
 * Progrès hors-ligne : seules les MACHINES tournent en l'absence du joueur
 * (on ne lave pas à la main pendant qu'on est parti). L'énergie se recharge.
 */
export function applyOffline(state: GameState, now: number): { seconds: number; earned: Decimal } {
  const elapsed = Math.max(0, (now - state.lastSeen) / 1000);
  const seconds = Math.min(elapsed, OFFLINE_CAP_SECONDS) * state.tempo;
  const earned = machineDishesPerSec(state).mul(state.valuePerDish).mul(seconds);
  state.money = state.money.add(earned);
  state.energy = Math.min(ENERGY_MAX, state.energy + ENERGY_REGEN_PER_SEC * seconds);
  state.lastSeen = now;
  return { seconds, earned };
}
