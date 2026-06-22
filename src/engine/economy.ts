import { D, ZERO, type Decimal } from "./numbers";
import { ENERGY_MAX, type GameState } from "./state";
import { AI_BASE_INCOME, GPU_MULT_PER_UNIT, GENERATORS_BY_ID } from "./content/generators";
import { sponsoringIncomePerSec } from "./content/audience";

export function costOf(base: Decimal, growth: number, owned: number, count = 1): Decimal {
  const g = D(growth);
  const first = base.mul(g.pow(owned));
  if (count <= 1) return first;
  const factor = g.pow(count).sub(1).div(g.sub(1));
  return first.mul(factor);
}

/** Fraction 0..1 qui module le travail MANUEL. Vaut 1 tant que l'énergie n'est pas en jeu. */
export function energyFactor(state: GameState): number {
  if (!state.flags.energyVisible) return 1;
  return Math.max(0, state.energy) / ENERGY_MAX;
}

/** Assiettes/s lavées à la main en continu (plonge uniquement), modulé par l'énergie. */
export function handDishesPerSec(state: GameState): number {
  if (state.job !== "plongeur" || state.manualRetired || !state.handWashing) return 0;
  return state.handRate * energyFactor(state);
}

/** Assiettes/s produites par les machines de plonge. */
export function machineDishesPerSec(state: GameState): Decimal {
  let total = ZERO;
  for (const id in state.generators) {
    const def = GENERATORS_BY_ID[id];
    if (!def || def.kind !== "plonge") continue;
    total = total.add(def.output.mul(state.generators[id]));
  }
  return total;
}

/** Débit total de plonge en assiettes/s (machines + main). */
export function dishesPerSec(state: GameState): Decimal {
  return machineDishesPerSec(state).add(handDishesPerSec(state));
}

export function dishesPerMinute(state: GameState): Decimal {
  return dishesPerSec(state).mul(60);
}

/**
 * €/s des générateurs dev (automatisation, indépendant de l'énergie).
 * Les juniors : brut érodé par les GPU (l'IA reprend leur travail) moins un salaire fixe.
 * Le net peut devenir négatif quand l'IA est forte → on est poussé à remplacer l'équipe.
 */
export function devIncomePerSec(state: GameState): Decimal {
  const gpus = state.generators["gpu"] ?? 0;
  let total = ZERO;
  for (const id in state.generators) {
    const def = GENERATORS_BY_ID[id];
    if (!def || def.kind !== "dev") continue;
    const grossPerUnit = def.redundancyPerGpu
      ? def.output.sub(def.redundancyPerGpu * gpus).max(0)
      : def.output;
    const netPerUnit = def.salaryPerSec ? grossPerUnit.sub(def.salaryPerSec) : grossPerUnit;
    total = total.add(netPerUnit.mul(state.generators[id]));
  }
  return total;
}

/** €/s de l'IA : un socle de base, multiplié par le nombre de GPU. 0 tant que l'IA n'est pas activée. */
export function aiIncomePerSec(state: GameState): Decimal {
  if (!state.flags.aiResolving) return ZERO;
  const gpus = state.generators["gpu"] ?? 0;
  return D(AI_BASE_INCOME).mul(1 + GPU_MULT_PER_UNIT * gpus);
}

/** €/s de la boîte (entrepreneur) : produits (scalés par l'armée de GPU) + acquisitions. */
export function bizIncomePerSec(state: GameState): Decimal {
  let total = ZERO;
  const gpus = state.generators["gpu"] ?? 0;
  const gpuFactor = 1 + state.gpuProductBoost * gpus;
  for (const id in state.generators) {
    const def = GENERATORS_BY_ID[id];
    if (!def || def.kind !== "biz") continue;
    const unit = def.scalesWithGpu ? def.output.mul(gpuFactor) : def.output;
    total = total.add(unit.mul(state.generators[id]));
  }
  return total;
}

/** Followers/s produits par les campagnes d'image (audience passive). */
export function audienceFollowersPerSec(state: GameState): Decimal {
  let total = ZERO;
  for (const id in state.generators) {
    const def = GENERATORS_BY_ID[id];
    if (!def || def.kind !== "audience") continue;
    total = total.add(def.output.mul(state.generators[id]));
  }
  return total;
}

/** Revenu passif (hors clic et hors lavage à la main) : plonge si encore plongeur + dev + IA + boîte + sponsoring. */
export function passiveIncomePerSec(state: GameState): Decimal {
  let total = devIncomePerSec(state)
    .add(aiIncomePerSec(state))
    .add(bizIncomePerSec(state))
    .add(sponsoringIncomePerSec(state));
  if (state.job === "plongeur") {
    total = total.add(machineDishesPerSec(state).mul(state.valuePerDish));
  }
  return total;
}

/** Revenu/s en jeu : passif + lavage continu à la main (plonge). */
export function incomePerSec(state: GameState): Decimal {
  let total = passiveIncomePerSec(state);
  if (state.job === "plongeur") {
    total = total.add(D(handDishesPerSec(state)).mul(state.valuePerDish));
  }
  return total;
}
