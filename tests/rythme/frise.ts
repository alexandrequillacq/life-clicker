// Frise du chapitre plongeur, en une commande :
//   node_modules/.bin/vite-node tests/rythme/frise.ts            (les cinq parties de référence)
//   node_modules/.bin/vite-node tests/rythme/frise.ts -- 4 afk   (une seule : clics/s, puis afk et/ou refuse)
//   node_modules/.bin/vite-node tests/rythme/frise.ts -- exact   (les instants au centième, pour comparer deux versions)
// Imprime, pour chaque partie : la durée, le plus grand écart, le temps mort, puis la frise des nouveautés.
import { playthrough, showsByItself, SCENARIOS, type PlaythroughOptions } from "./playthrough";
import { REVEAL_BY_ID } from "../../src/engine/content/plonge";

declare const process: { argv: string[] }; // lancé par vite-node (Node)

const mmss = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs - m * 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

function report(name: string, cps: number, opts: PlaythroughOptions = {}): void {
  const r = playthrough(cps, opts);
  let gapAt = "";
  for (let i = 1; i < r.reveals.length; i++) {
    if (r.reveals[i][1] - r.reveals[i - 1][1] === r.maxGap) gapAt = `${r.reveals[i - 1][0]} → ${r.reveals[i][0]}`;
  }
  console.log(`\n== ${name}`);
  console.log(`durée ${mmss(r.secs)} · plus grand écart ${mmss(r.maxGap)} (${gapAt}) · temps mort ${Math.round(r.dead)} s, au plus ${Math.round(r.deadMax)} s d'affilée`);
  // La frise : chaque nouveauté (avec sa nature), et en retrait l'instant où le joueur achète.
  const lines: [number, string][] = [
    ...r.reveals.map(([k, t]): [number, string] => [t, `${k}${REVEAL_BY_ID[k] ? ` (${REVEAL_BY_ID[k].kind})` : ""}`]),
    ...r.purchases.map(([k, t]): [number, string] => [t, `    achète ${k}`]),
  ].sort((a, b) => a[0] - b[0]);
  let prev = 0;
  for (const [t, label] of lines) {
    console.log(`  ${mmss(t).padStart(6)}  +${Math.round(t - prev).toString().padStart(3)} s  ${label}`);
    prev = t;
  }
  const alone = r.reveals.filter(([k, t]) => t > 5 && showsByItself(k));
  const close = alone.slice(1).map((x, i) => [alone[i], x] as const).filter(([a, b]) => b[1] - a[1] < 30);
  for (const [a, b] of close) console.log(`  ! trop proches : ${a[0]} et ${b[0]} (${Math.round(b[1] - a[1])} s)`);
}

const args = process.argv.slice(2).filter((a) => a !== "--");
if (args.includes("exact")) {
  for (const sc of SCENARIOS) {
    const r = playthrough(sc.cps, sc.opts);
    console.log(sc.name, r.secs.toFixed(2), r.dead.toFixed(2), r.deadMax.toFixed(2));
    for (const [k, t] of r.reveals) console.log(`  ${t.toFixed(2)} ${k}`);
  }
} else if (args.length > 0) {
  const cps = Number(args[0]);
  report(args.join(" "), cps, { afk: args.includes("afk"), refuse: args.includes("refuse") });
} else {
  for (const sc of SCENARIOS) report(sc.name, sc.cps, sc.opts);
}
