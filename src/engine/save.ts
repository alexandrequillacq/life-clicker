import { D, type Decimal } from "./numbers";
import { type GameState, SAVE_VERSION, createInitialState } from "./state";

const KEY = "life-clicker-save";
const BACKUP_KEY = "life-clicker-save-backup";

export function serialize(state: GameState): string {
  return JSON.stringify({
    ...state,
    money: state.money.toString(),
    perClick: state.perClick.toString(),
  });
}

export function migrate(raw: any): any {
  const s = raw;
  // v1 : aucune migration. Point d'extension : if (s.version < 2) { ...; s.version = 2; }
  return s;
}

export function deserialize(json: string): GameState {
  const migrated = migrate(JSON.parse(json));
  return {
    ...migrated,
    money: D(migrated.money) as Decimal,
    perClick: D(migrated.perClick) as Decimal,
  };
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
    const state = deserialize(json);
    if (state.version > SAVE_VERSION) {
      console.warn("Save d'une version plus récente — démarrage à neuf");
      return createInitialState(now);
    }
    return state;
  } catch (e) {
    console.error("Save corrompue — backup et démarrage à neuf", e);
    localStorage.setItem(BACKUP_KEY, json);
    return createInitialState(now);
  }
}
