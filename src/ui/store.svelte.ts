import { load, clearSave } from "../engine/save";
import { applyOffline } from "../engine/offline";
import { createInitialState, type GameState } from "../engine/state";

const bootNow = Date.now();
const initial = load(bootNow);
applyOffline(initial, bootNow); // crédite la progression hors-ligne en silence

export const game = $state<{ state: GameState }>({ state: initial });

// Bouton de test : efface la sauvegarde et repart d'un état neuf.
export function resetGame(): void {
  clearSave();
  game.state = createInitialState(Date.now());
}
