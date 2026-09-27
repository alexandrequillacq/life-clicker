import { D, type Decimal } from "./numbers";
import {
  type GameState,
  SAVE_VERSION,
  createInitialState,
  createPlongeState,
  INCIDENT_PERIOD,
  INCIDENT_AUTO_RESOLVE,
} from "./state";
import { MISSION_PERIOD } from "./content/missions";
import { BADBUZZ_OFFSET } from "./content/audience";

const KEY = "life-clicker-save";
const BACKUP_KEY = "life-clicker-save-backup";

export function serialize(state: GameState): string {
  return JSON.stringify({
    ...state,
    money: state.money.toString(),
    valuePerDish: state.valuePerDish.toString(),
    followers: state.followers.toString(),
    maxFollowers: state.maxFollowers.toString(),
    emprise: state.emprise.toString(),
    ctoEarned: state.ctoEarned.toString(),
    probes: state.probes.toString(),
  });
}

export function deserialize(json: string): GameState {
  const raw = JSON.parse(json);
  return {
    ...raw,
    money: D(raw.money) as Decimal,
    valuePerDish: D(raw.valuePerDish) as Decimal,
    // Valeurs par défaut pour les champs ajoutés à un schéma de même version.
    plonge: { ...createPlongeState(), ...(raw.plonge ?? {}) },
    souvenirs: raw.souvenirs ?? [],
    homeLevel: raw.homeLevel ?? 0,
    job: raw.job ?? "plongeur",
    devClickMult: raw.devClickMult ?? 1,
    gpuProductBoost: raw.gpuProductBoost ?? 0.1,
    // Arc dev (missions, incidents, décisions) : défauts pour tout champ ajouté à un schéma de même version.
    bugsResolved: raw.bugsResolved ?? 0,
    missionsDone: raw.missionsDone ?? 0,
    mission: raw.mission ?? null,
    missionTimer: raw.missionTimer ?? MISSION_PERIOD,
    incident: raw.incident ?? null,
    incidentTimer: raw.incidentTimer ?? INCIDENT_PERIOD,
    incidentPeriodMult: raw.incidentPeriodMult ?? 1,
    incidentAutoResolveSecs: raw.incidentAutoResolveSecs ?? INCIDENT_AUTO_RESOLVE,
    decisionIndex: raw.decisionIndex ?? 0,
    pendingDecision: raw.pendingDecision ?? false,
    ctoEarned: D(raw.ctoEarned ?? 0) as Decimal,
    teamOutputMult: raw.teamOutputMult ?? 1,
    gpuCostMult: raw.gpuCostMult ?? 1,
    hireCostMult: raw.hireCostMult ?? 1,
    gpuErosionMult: raw.gpuErosionMult ?? 1,
    aiRateMult: raw.aiRateMult ?? 1,
    followers: D(raw.followers ?? 0) as Decimal,
    maxFollowers: D(raw.maxFollowers ?? raw.followers ?? 0) as Decimal,
    followerPacks: raw.followerPacks ?? 0,
    keynoteTimer: raw.keynoteTimer ?? 0,
    keynoteBoostLeft: raw.keynoteBoostLeft ?? 0,
    trendTimer: raw.trendTimer ?? 0,
    badBuzz: raw.badBuzz ?? null,
    badBuzzTimer: raw.badBuzzTimer ?? BADBUZZ_OFFSET,
    sens: raw.sens ?? 0,
    vieVecueTicks: raw.vieVecueTicks ?? 0,
    vieAutomatiseeCount: raw.vieAutomatiseeCount ?? (raw.flags?.vieAutomatisee ? 1 : 0),
    secsSinceLife: raw.secsSinceLife ?? 0,
    emprise: D(raw.emprise ?? 0) as Decimal,
    acteCooldown: raw.acteCooldown ?? 0,
    // Acte III (chunk C) : meetings, damiers de contrôle, Résistance, sondes.
    acteCounts: raw.acteCounts ?? {},
    meetingCooldown: raw.meetingCooldown ?? 0,
    controls: raw.controls ?? {},
    resistance: raw.resistance ?? 0,
    probes: D(raw.probes ?? 0) as Decimal,
    karma: raw.karma ?? 0,
  };
}

export function clearSave(): void {
  localStorage.removeItem(KEY);
  localStorage.removeItem(BACKUP_KEY);
}

export function save(state: GameState): void {
  try {
    localStorage.setItem(KEY, serialize(state));
  } catch (e) {
    console.error("Échec de sauvegarde", e);
  }
}

export function load(now: number): GameState {
  const json = localStorage.getItem(KEY);
  if (!json) return createInitialState(now);
  try {
    const raw = JSON.parse(json);
    // Pas de migration entre modèles incompatibles : on archive et on repart à neuf.
    // (Point d'extension : migrer ici quand le schéma évolue de façon compatible.)
    if (raw.version !== SAVE_VERSION) {
      localStorage.setItem(BACKUP_KEY, json);
      return createInitialState(now);
    }
    return deserialize(json);
  } catch (e) {
    console.error("Save corrompue — archivage et démarrage à neuf", e);
    localStorage.setItem(BACKUP_KEY, json);
    return createInitialState(now);
  }
}
