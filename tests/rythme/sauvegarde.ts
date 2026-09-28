// Une sauvegarde (JSON) à l'instant t d'une partie à 4 clics/s, pour vérifier un moment précis dans le navigateur :
//   node_modules/.bin/vite-node tests/rythme/sauvegarde.ts -- 760 > save.json
// puis l'écrire sous la clé « life-clicker-save » (voir la mémoire « environnement de dev »).
import { playthrough } from "./playthrough";
import { serialize } from "../../src/engine/save";

declare const process: { argv: string[] };
const at = Number(process.argv.slice(2).filter((a) => a !== "--")[0] ?? 600);
let out = "";
playthrough(4, {
  onStep: (s, t) => {
    if (!out && t >= at) out = serialize({ ...s, lastSeen: Date.now() });
  },
});
console.log(out);
