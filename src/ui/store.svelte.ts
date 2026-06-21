import { load } from "../engine/save";
import { applyOffline } from "../engine/offline";
import type { GameState } from "../engine/state";
import type { Decimal } from "../engine/numbers";

const bootNow = Date.now();
const initial = load(bootNow);
const report = applyOffline(initial, bootNow);

export const game = $state<{ state: GameState; offlineEarned: Decimal | null }>({
  state: initial,
  offlineEarned: report.seconds > 1 && report.earned.gt(0) ? report.earned : null,
});
