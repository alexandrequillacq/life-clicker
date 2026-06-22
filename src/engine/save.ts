import { D, type Decimal } from "./numbers";
import { type GameState, SAVE_VERSION, createInitialState } from "./state";

const KEY = "life-clicker-save";
const BACKUP_KEY = "life-clicker-save-backup";

export function serialize(state: GameState): string {
  return JSON.stringify({
    ...state,
    money: state.money.toString(),
    valuePerDish: state.valuePerDish.toString(),
    followers: state.followers.toString(),
    emprise: state.emprise.toString(),
  });
}

export function deserialize(json: string): GameState {
  const raw = JSON.parse(json);
  return {
    ...raw,
    money: D(raw.money) as Decimal,
    valuePerDish: D(raw.valuePerDish) as Decimal,
    // Valeurs par défaut pour les champs ajoutés à un schéma de même version.
    studyLevel: raw.studyLevel ?? 0,
    homeLevel: raw.homeLevel ?? 0,
    job: raw.job ?? "plongeur",
    devClickMult: raw.devClickMult ?? 1,
    gpuProductBoost: raw.gpuProductBoost ?? 0.1,
    followers: D(raw.followers ?? 0) as Decimal,
    followerPacks: raw.followerPacks ?? 0,
    sens: raw.sens ?? 0,
    vieVecueTicks: raw.vieVecueTicks ?? 0,
    vieAutomatiseeCount: raw.vieAutomatiseeCount ?? (raw.flags?.vieAutomatisee ? 1 : 0),
    secsSinceLife: raw.secsSinceLife ?? 0,
    emprise: D(raw.emprise ?? 0) as Decimal,
    acteCooldown: raw.acteCooldown ?? 0,
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
