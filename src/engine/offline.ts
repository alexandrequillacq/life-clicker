import type { GameState } from "./state";
import { production } from "./economy";
import { type Decimal } from "./numbers";

export const OFFLINE_CAP_SECONDS = 4 * 3600;

export function applyOffline(state: GameState, now: number): { seconds: number; earned: Decimal } {
  const elapsed = Math.max(0, (now - state.lastSeen) / 1000);
  const seconds = Math.min(elapsed, OFFLINE_CAP_SECONDS) * state.tempo;
  const earned = production(state).mul(seconds);
  state.money = state.money.add(earned);
  state.lastSeen = now;
  return { seconds, earned };
}
