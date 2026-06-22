import {
  ENERGY_DRAIN_PER_DISH,
  ENERGY_MAX,
  ENERGY_REGEN_PER_SEC,
  type GameState,
} from "./state";
import { incomePerSec, handDishesPerSec, audienceFollowersPerSec } from "./economy";
import { GENERATORS, generatorVisible } from "./content/generators";
import { studiesComplete } from "./content/studies";
import { computeInitialSens, NEGLECT_SECONDS, SENS_DRIFT_PER_SEC } from "./content/audience";

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
  // Les études s'ouvrent une fois la Vie là (on a enfin le temps).
  if (!state.flags.studyVisible && state.flags.lifeVisible) {
    state.flags.studyVisible = true;
  }
  // Révélation du Sens (célébrité) : causée par la NÉGLIGENCE de la vie ou son automatisation, jamais par l'argent.
  if (
    !state.flags.sensRevealed &&
    state.job === "celebrite" &&
    (state.secsSinceLife > NEGLECT_SECONDS || state.vieAutomatiseeCount >= 1)
  ) {
    state.flags.sensRevealed = true;
    state.sens = computeInitialSens(state);
  }
  // Postuler comme développeur quand tous les livres sont lus.
  if (
    !state.flags.postulerVisible &&
    state.job === "plongeur" &&
    studiesComplete(state.studyLevel)
  ) {
    state.flags.postulerVisible = true;
  }
  // Révélation des générateurs au seuil d'argent (et flag requis + bon métier).
  for (const g of GENERATORS) {
    const flag = `gen_${g.id}_unlocked`;
    const flagOk = !g.requiresFlag || state.flags[g.requiresFlag];
    if (
      !state.flags[flag] &&
      flagOk &&
      generatorVisible(g.kind, state.job) &&
      state.money.gte(g.unlockAtMoney)
    ) {
      state.flags[flag] = true;
    }
  }
}

export function tick(state: GameState, dt: number): void {
  const t = dt * state.tempo;

  // Revenu : assiettes × valeur. Le manuel est modulé par l'énergie ; les machines non.
  // Le net peut être négatif (équipe de juniors en perte sous IA forte) ; jamais d'argent négatif.
  state.money = state.money.add(incomePerSec(state).mul(t)).max(0);

  // Audience : followers passifs des campagnes d'image.
  state.followers = state.followers.add(audienceFollowersPerSec(state).mul(t));

  // Suivi de la vie : temps écoulé depuis le dernier geste de vie.
  state.secsSinceLife += t;
  // Sens (une fois révélé) : dérive lentement vers le bas si la vie est négligée.
  if (state.flags.sensRevealed && state.secsSinceLife > NEGLECT_SECONDS) {
    state.sens = Math.max(0, state.sens - SENS_DRIFT_PER_SEC * t);
  }

  // Énergie : le lavage continu à la main la draine proportionnellement aux assiettes
  // lavées ; régénération constante par ailleurs → palier soutenable, jamais bloqué à 0.
  if (state.flags.energyVisible) {
    const drain = ENERGY_DRAIN_PER_DISH * handDishesPerSec(state);
    const delta = (ENERGY_REGEN_PER_SEC - drain) * t;
    state.energy = Math.max(0, Math.min(ENERGY_MAX, state.energy + delta));
  }

  updateFlags(state);
}
