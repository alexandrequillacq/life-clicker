import { ENERGY_MAX, ENERGY_REGEN_PER_SEC, type GameState } from "./state";
import { passiveIncomePerSec } from "./economy";
import { type Decimal } from "./numbers";

export const OFFLINE_CAP_SECONDS = 4 * 3600;

/**
 * Progrès hors-ligne : seul le revenu PASSIF tourne en l'absence du joueur
 * (machines de plonge si encore plongeur + automatisation dev). Pas de travail
 * manuel. L'énergie se recharge.
 */
export function applyOffline(state: GameState, now: number): { seconds: number; earned: Decimal } {
  const elapsed = Math.max(0, (now - state.lastSeen) / 1000);
  const seconds = Math.min(elapsed, OFFLINE_CAP_SECONDS) * state.tempo;
  const earned = passiveIncomePerSec(state).mul(seconds);
  state.money = state.money.add(earned);
  state.energy = Math.min(ENERGY_MAX, state.energy + ENERGY_REGEN_PER_SEC * seconds);
  state.lastSeen = now;
  return { seconds, earned };
}
