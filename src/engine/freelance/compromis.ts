import type { GameState } from "../state";
import { COMPROMIS_LINES } from "../content/freelance";
import { deliverReady } from "./carnet";
import { acted } from "./revelations";

// Le compromis du chapitre 2 : désactiver le test qui échoue. Gratuit, rentable, jamais obligatoire.
// Le coût tombe sur les clients de tes clients ; tu ne l'apprends que par la ligne du haut.

export const compromisVisible = (s: GameState): boolean => s.job === "freelance" && s.freelance.compromis === "offered";

export function takeCompromis(s: GameState): boolean {
  if (!compromisVisible(s)) return false;
  const f = s.freelance;
  f.compromis = "taken";
  f.compMult = COMPROMIS_LINES;
  f.bugs = f.bugs.filter((b) => b.order === null);
  for (const o of f.orders) if (o.red === "failing") o.red = "passed";
  f.compromisQuoteDue = true;
  deliverReady(s);
  acted(s);
  return true;
}
