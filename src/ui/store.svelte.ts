import { load } from "../engine/save";
import { applyOffline } from "../engine/offline";
import type { GameState } from "../engine/state";

const bootNow = Date.now();
const initial = load(bootNow);
applyOffline(initial, bootNow); // crédite la progression hors-ligne en silence

export const game = $state<{ state: GameState }>({ state: initial });
