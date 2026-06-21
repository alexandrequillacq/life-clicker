import { D, type Decimal } from "./numbers";
import { type GameState, SAVE_VERSION, createInitialState } from "./state";

const KEY = "life-clicker-save";
const BACKUP_KEY = "life-clicker-save-backup";

export function serialize(state: GameState): string {
  return JSON.stringify({
    ...state,
    money: state.money.toString(),
    valuePerDish: state.valuePerDish.toString(),
  });
}

export function deserialize(json: string): GameState {
  const raw = JSON.parse(json);
  return {
    ...raw,
    money: D(raw.money) as Decimal,
    valuePerDish: D(raw.valuePerDish) as Decimal,
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
