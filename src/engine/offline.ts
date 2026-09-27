import { ENERGY_MAX, ENERGY_REGEN_PER_SEC, type GameState } from "./state";
import { passiveIncomePerSec } from "./economy";
import { plongeOfflineIncomePerSec } from "./plonge";
import { PLONGE_OFFLINE_CAP } from "./content/plonge";
import { type Decimal } from "./numbers";

export const OFFLINE_CAP_SECONDS = 4 * 3600;

/**
 * Progrès hors-ligne : seul le revenu PASSIF tourne en l'absence du joueur
 * (machines de plonge si encore plongeur + automatisation dev). Pas de travail
 * manuel. L'énergie se recharge.
 */
export function applyOffline(state: GameState, now: number): { seconds: number; earned: Decimal } {
  const elapsed = Math.max(0, (now - state.lastSeen) / 1000);
  // Au plongeur, le hors-ligne est plafonné à 10 min (sinon une nuit d'absence saute le chapitre)
  // et limité par ce que le restaurant salit : les machines seules, jamais les mains.
  const plongeur = state.job === "plongeur";
  const cap = plongeur ? PLONGE_OFFLINE_CAP : OFFLINE_CAP_SECONDS;
  const seconds = Math.min(elapsed, cap) * state.tempo;
  const rate = plongeur ? plongeOfflineIncomePerSec(state) : passiveIncomePerSec(state);
  const earned = rate.mul(seconds);
  state.money = state.money.add(earned);
  state.energy = Math.min(ENERGY_MAX, state.energy + ENERGY_REGEN_PER_SEC * seconds);
  state.lastSeen = now;
  return { seconds, earned };
}
