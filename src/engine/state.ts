import { D, type Decimal, ZERO } from "./numbers";

export const SAVE_VERSION = 1;

export interface GameState {
  version: number;
  money: Decimal;
  perClick: Decimal;
  generators: Record<string, number>;
  flags: Record<string, boolean>;
  tempo: number;
  startedAt: number;
  lastSeen: number;
  totalClicks: number;
}

export function createInitialState(now: number): GameState {
  return {
    version: SAVE_VERSION,
    money: ZERO,
    perClick: D(0.05),
    generators: {},
    flags: {},
    tempo: 1,
    startedAt: now,
    lastSeen: now,
    totalClicks: 0,
  };
}
