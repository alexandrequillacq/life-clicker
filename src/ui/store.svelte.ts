import { load, clearSave } from "../engine/save";
import { applyOffline } from "../engine/offline";
import { createInitialState, type GameState } from "../engine/state";
import { karmaGain } from "../engine/content/power";

const bootNow = Date.now();
const initial = load(bootNow);
applyOffline(initial, bootNow); // crédite la progression hors-ligne en silence

export const game = $state<{ state: GameState }>({ state: initial });

// Bouton de test : efface la sauvegarde et repart d'un état neuf.
export function resetGame(): void {
  clearSave();
  game.state = createInitialState(Date.now());
}

// Bouton de test : double l'argent courant (pour avancer plus vite en playtest).
export function doubleMoney(): void {
  game.state.money = game.state.money.mul(2);
}

// Épilogue : tout lâcher et revivre. Le karma (récompense de la vie préservée) traverse la réincarnation.
export function reincarnate(): void {
  const k = game.state.karma + karmaGain(game.state.sens);
  clearSave();
  game.state = createInitialState(Date.now(), k);
}
