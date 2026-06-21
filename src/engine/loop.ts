import {
  ENERGY_DRAIN_PER_DISH,
  ENERGY_MAX,
  ENERGY_REGEN_PER_SEC,
  type GameState,
} from "./state";
import { incomePerSec, handDishesPerSec } from "./economy";
import { GENERATORS } from "./content/generators";

export function updateFlags(state: GameState): void {
  if (!state.flags.moneyVisible && (state.totalClicks > 0 || state.money.gt(0))) {
    state.flags.moneyVisible = true;
  }
  // L'énergie entre en jeu dès qu'on lave en continu à la main.
  if (!state.flags.energyVisible && state.handWashing) {
    state.flags.energyVisible = true;
  }
  // « Poser les gants » : proposé une fois 2 machines en route, tant qu'on bosse encore à la main.
  if (
    !state.flags.poseGantsVisible &&
    (state.generators["lave_vaisselle"] ?? 0) >= 2 &&
    !state.manualRetired
  ) {
    state.flags.poseGantsVisible = true;
  }
  // La Vie apparaît une fois les gants posés.
  if (!state.flags.lifeVisible && state.manualRetired) {
    state.flags.lifeVisible = true;
  }
  // Révélation des machines au seuil d'argent.
  for (const g of GENERATORS) {
    const flag = `gen_${g.id}_unlocked`;
    if (!state.flags[flag] && state.money.gte(g.unlockAtMoney)) {
      state.flags[flag] = true;
    }
  }
}

export function tick(state: GameState, dt: number): void {
  const t = dt * state.tempo;

  // Revenu : assiettes × valeur. Le manuel est modulé par l'énergie ; les machines non.
  state.money = state.money.add(incomePerSec(state).mul(t));

  // Énergie : le lavage continu à la main la draine proportionnellement aux assiettes
  // lavées ; régénération constante par ailleurs → palier soutenable, jamais bloqué à 0.
  if (state.flags.energyVisible) {
    const drain = ENERGY_DRAIN_PER_DISH * handDishesPerSec(state);
    const delta = (ENERGY_REGEN_PER_SEC - drain) * t;
    state.energy = Math.max(0, Math.min(ENERGY_MAX, state.energy + delta));
  }

  updateFlags(state);
}
