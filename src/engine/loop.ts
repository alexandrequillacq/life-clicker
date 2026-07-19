import { D } from "./numbers";
import {
  ENERGY_DRAIN_PER_DISH,
  ENERGY_MAX,
  ENERGY_REGEN_PER_SEC,
  INCIDENT_PERIOD,
  type GameState,
} from "./state";
import { incomePerSec, handDishesPerSec, audienceFollowersPerSec, emprisePerSec, humanTeamSize } from "./economy";
import { GENERATORS, generatorAvailable } from "./content/generators";
import { studiesComplete } from "./content/studies";
import {
  computeInitialSens,
  NEGLECT_SECONDS,
  SENS_DRIFT_PER_SEC,
  TREND_PERIOD,
  BADBUZZ_PERIOD,
  BADBUZZ_DURATION,
  BADBUZZ_DRAIN,
  BADBUZZ_MIN_FOLLOWERS,
} from "./content/audience";
import { EPILOGUE_EMPRISE } from "./content/power";
import { MISSION_PERIOD, MISSION_WINDOW, MISSION_MIN_BUGS, missionTier } from "./content/missions";
import { DECISIONS } from "./content/decisions";
import {
  RESISTANCE_RATE_PRESIDENT,
  RESISTANCE_RATE_MONDE,
  RESISTANCE_REPRESSION_RATE,
  controlsOwnedForJob,
  repressionOwned,
} from "./content/control";
import { PROBE_GROWTH } from "./content/cosmos";

/**
 * Arc dev déterministe (développeur → lead → CTO) : missions freelance, incidents d'équipe,
 * cartes de décision. Zéro RNG : périodes fixes, fenêtres datées.
 */
function tickArcDev(state: GameState, t: number): void {
  // Développeur : missions freelance à fenêtre (dès 10 bugs résolus).
  if (state.job === "developpeur") {
    if (state.mission) {
      state.mission.timeLeft -= t;
      if (state.mission.timeLeft <= 0) {
        state.mission = null; // expirée : disparaît jusqu'à la prochaine
        state.missionTimer = MISSION_PERIOD;
      }
    } else if (state.bugsResolved >= MISSION_MIN_BUGS) {
      state.missionTimer -= t;
      if (state.missionTimer <= 0) {
        state.mission = { tier: missionTier(state.missionsDone), progress: 0, timeLeft: MISSION_WINDOW };
      }
    }
  }

  // Lead dev & CTO : incidents périodiques tant qu'il y a une équipe humaine et que l'IA ne résout pas.
  const incidentsActive =
    (state.job === "lead_dev" || state.job === "cto") &&
    humanTeamSize(state) > 0 &&
    !state.flags.aiResolving;
  if (incidentsActive) {
    if (state.incident) {
      state.incident.timeLeft -= t;
      if (state.incident.timeLeft <= 0) {
        state.incident = null; // s'éteint seul (vraie punition AFK, jamais un état permanent)
        state.incidentTimer = INCIDENT_PERIOD * state.incidentPeriodMult;
      }
    } else {
      state.incidentTimer -= t;
      if (state.incidentTimer <= 0) {
        state.incident = { timeLeft: state.incidentAutoResolveSecs };
      }
    }
  } else {
    // IA active ou équipe à 0 : incident et timer coupés (battement de thèse, jamais commenté).
    state.incident = null;
    state.incidentTimer = INCIDENT_PERIOD * state.incidentPeriodMult;
  }

  // CTO : une carte de décision s'arme dès que les gains cumulés atteignent son seuil.
  if (state.job === "cto" && !state.pendingDecision && state.decisionIndex < DECISIONS.length) {
    const card = DECISIONS[state.decisionIndex];
    if (state.ctoEarned.gte(card.threshold)) state.pendingDecision = true;
  }
}

/**
 * Arc Acte II déterministe (fondateur + célébrité) : décompte des timers de keynote,
 * cycle de tendance (fenêtre ×8) et polémiques (bad buzz qui draine le stock). Zéro RNG.
 */
function tickActeII(state: GameState, t: number): void {
  // Keynotes (fondateur) : le timer rend la prochaine keynote disponible ; le boost s'épuise.
  if (state.keynoteTimer > 0) state.keynoteTimer = Math.max(0, state.keynoteTimer - t);
  if (state.keynoteBoostLeft > 0) state.keynoteBoostLeft = Math.max(0, state.keynoteBoostLeft - t);

  // Célébrité : tendances et bad buzz (le cycle ne tourne qu'en célébrité).
  if (state.job === "celebrite") {
    state.trendTimer = (state.trendTimer + t) % TREND_PERIOD;

    // Polémique active : drain compound des followers courants (jamais sous 0), puis extinction seule.
    // On draine AVANT d'armer une nouvelle polémique : la fenêtre de la polémique qui vient de
    // démarrer ne consomme pas déjà du temps de drain dans le même tick.
    if (state.badBuzz) {
      const active = Math.min(t, state.badBuzz.timeLeft);
      state.followers = state.followers.mul(D(1 - BADBUZZ_DRAIN).pow(active)).max(0);
      state.badBuzz.timeLeft -= t;
      if (state.badBuzz.timeLeft <= 0) state.badBuzz = null;
    }

    // Timer de polémique : tourne dès qu'on est au-dessus du seuil (horloge alignée sur les tendances).
    if (state.followers.gte(BADBUZZ_MIN_FOLLOWERS)) {
      state.badBuzzTimer -= t;
      if (state.badBuzzTimer <= 0 && state.badBuzz === null) {
        state.badBuzz = { timeLeft: BADBUZZ_DURATION };
        state.badBuzzTimer += BADBUZZ_PERIOD;
      }
    }
  }
}

/**
 * Arc Acte III déterministe (politique → empereur) : cooldown de meeting, croissance des sondes,
 * et jauge de Résistance. Exécuté AVANT l'accumulation d'Emprise du tick, pour que la croissance
 * des sondes et l'état de la Résistance de ce tick soient reflétés dans emprisePerSec.
 * Ordre de tick documenté : les sondes croissent en composé, puis la Résistance se met à jour,
 * puis l'Emprise s'accumule sur l'intervalle avec ces valeurs de fin de tick.
 */
function tickActeIII(state: GameState, t: number): void {
  if (state.meetingCooldown > 0) state.meetingCooldown = Math.max(0, state.meetingCooldown - t);

  // Sondes von Neumann : croissance composée par tick (probes ×= 1 + 0,03 × dt).
  if (state.probes.gt(0)) {
    state.probes = state.probes.mul(1 + PROBE_GROWTH * t);
  }

  // Résistance : monte quand le contrôle atteint une masse critique, baissée par la répression.
  if (state.job === "president") {
    const slope = controlsOwnedForJob(state.controls, "president") >= 2 ? RESISTANCE_RATE_PRESIDENT : 0;
    const drop = repressionOwned(state.controls) * RESISTANCE_REPRESSION_RATE;
    state.resistance = clamp01to100(state.resistance + (slope - drop) * t);
  } else if (state.job === "monde") {
    const slope = controlsOwnedForJob(state.controls, "monde") >= 1 ? RESISTANCE_RATE_MONDE : 0;
    const drop = repressionOwned(state.controls) * RESISTANCE_REPRESSION_RATE;
    state.resistance = clamp01to100(state.resistance + (slope - drop) * t);
  } else if (state.job === "empereur") {
    state.resistance = 0; // plus personne pour résister à cette échelle
  }
}

function clamp01to100(v: number): number {
  return Math.max(0, Math.min(100, v));
}

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
    ((state.job === "celebrite" && (state.secsSinceLife > NEGLECT_SECONDS || state.vieAutomatiseeCount >= 1)) ||
      state.flags.act3)
  ) {
    state.flags.sensRevealed = true;
    state.sens = computeInitialSens(state);
  }
  // Épilogue : empereur cosmique au-delà du seuil final d'Emprise.
  if (!state.flags.epilogue && state.job === "empereur" && state.emprise.gte(EPILOGUE_EMPRISE)) {
    state.flags.epilogue = true;
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
      generatorAvailable(g, state.job) &&
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
  const income = incomePerSec(state);
  state.money = state.money.add(income.mul(t)).max(0);
  // CTO : gains cumulés depuis l'entrée en poste (revenu positif) → déclenchent les cartes de décision.
  // (Le CTO ne gagne rien au clic : cette source est donc son seul apport à ctoEarned.)
  if (state.job === "cto" && income.gt(0)) {
    state.ctoEarned = state.ctoEarned.add(income.mul(t));
  }

  // Audience : followers passifs des campagnes d'image.
  state.followers = state.followers.add(audienceFollowersPerSec(state).mul(t));

  // Acte III : sondes, Résistance et cooldown de meeting avant l'accumulation (voir tickActeIII).
  tickActeIII(state, t);
  // Acte III : l'Emprise s'accumule (appareil de pouvoir × armée de GPU, drainée par la Résistance).
  state.emprise = state.emprise.add(emprisePerSec(state).mul(t));
  if (state.acteCooldown > 0) state.acteCooldown = Math.max(0, state.acteCooldown - t);

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

  tickArcDev(state, t);
  tickActeII(state, t);

  // Pic historique de followers : mis à jour vers le haut uniquement (jamais rongé par le bad buzz).
  // Porte la gate politique : le stock peut chuter, le pic tient.
  state.maxFollowers = state.maxFollowers.max(state.followers);

  updateFlags(state);
}
