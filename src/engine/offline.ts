import { ENERGY_MAX, ENERGY_REGEN_PER_SEC, type GameState } from "./state";
import { passiveIncomePerSec } from "./economy";
import { plongeOfflineIncomePerSec } from "./plonge";
import { PLONGE_OFFLINE_CAP } from "./content/plonge";
import { FL_OFFLINE_CAP } from "./content/freelance";
import { tickFreelance } from "./freelance";
import { type Decimal } from "./numbers";

export const OFFLINE_CAP_SECONDS = 4 * 3600;

/**
 * Progrès hors-ligne : seul le revenu PASSIF tourne en l'absence du joueur
 * (machines de plonge si encore plongeur + automatisation dev). Pas de travail
 * manuel. L'énergie se recharge.
 */
export function applyOffline(state: GameState, now: number): { seconds: number; earned: Decimal } {
  const elapsed = Math.max(0, (now - state.lastSeen) / 1000);
  // Au chapitre 2, le hors-ligne rejoue au plus 10 min de calendrier, seconde par seconde, mains au repos :
  // l'IA écrit, les lundis tombent, le loyer se paie ; tes mains, elles, ne font rien.
  if (state.job === "freelance") {
    const secs = Math.min(elapsed, FL_OFFLINE_CAP) * state.tempo;
    const before = state.money;
    for (let t = 0; t < secs - 1e-9; t += 1) tickFreelance(state, Math.min(1, secs - t));
    state.lastSeen = now;
    return { seconds: secs, earned: state.money.sub(before) };
  }
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
