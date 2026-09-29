import { describe, it, expect } from "vitest";
import { playFreelance, type FlJoueur } from "./rythme/freelance";
import { D } from "../src/engine/numbers";
import { TOOLS, PROPOSALS, FL_WEEK_SECS } from "../src/engine/content/freelance";
import { hireNora, toolOffered, visibleProposals } from "../src/engine/freelance";
import { tick } from "../src/engine/loop";
import type { GameState } from "../src/engine/state";

const joueur = (cps: number): FlJoueur => ({ cps, buys: true, answersMaman: true, dinners: true });
const MIN = 60;

describe("chapitre 2 : le rythme (R7)", () => {
  const runs = [2, 4, 6].map((cps) => ({ cps, ...playFreelance(joueur(cps), 30 * MIN) }));

  for (const r of runs) {
    it(`à ${r.cps} clics / s : la sortie entre 10 et 22 min, jamais plus de 180 s sans nouveauté`, () => {
      expect(r.trace.exitAt).not.toBeNull();
      expect(r.trace.exitAt!).toBeGreaterThanOrEqual(10 * MIN);
      expect(r.trace.exitAt!).toBeLessThanOrEqual(22 * MIN);
      expect(r.trace.maxGap).toBeLessThanOrEqual(180);
    });
    it(`à ${r.cps} clics / s : tous les outils et toutes les propositions ont paru`, () => {
      expect(r.trace.tools.sort()).toEqual(TOOLS.map((t) => t.id).sort());
      expect(r.trace.proposals.sort()).toEqual(PROPOSALS.map((p) => p.id).sort());
    });
  }

  it("le joueur rapide ne sort pas plus de 60 s après le joueur moyen", () => {
    const moyen = runs.find((r) => r.cps === 4)!.trace.exitAt!;
    const rapide = runs.find((r) => r.cps === 6)!.trace.exitAt!;
    expect(rapide - moyen).toBeLessThanOrEqual(60);
  });

  it("sans clic, rien ne casse : Mme Duval attend, l'argent reste à 0 €", () => {
    const { s, trace } = playFreelance({ cps: 0, buys: true, answersMaman: false, dinners: false }, 10 * MIN);
    expect(trace.exitAt).toBeNull();
    expect(s.freelance.company).toBeNull();
    expect(s.money.toNumber()).toBe(0);
    expect(Number.isFinite(s.energy)).toBe(true);
  });

  it("celui qui refuse tout garde toujours une offre à l'écran", () => {
    const { s } = playFreelance({ cps: 4, buys: false, answersMaman: true, dinners: false }, 12 * MIN);
    expect(toolOffered(s) !== undefined || visibleProposals(s).length > 0).toBe(true);
  });

  it("un départ à −2 000 € sort quand même", () => {
    const { trace } = playFreelance(joueur(4), 30 * MIN, (s) => {
      s.money = D(-2000);
    });
    expect(trace.exitAt).not.toBeNull();
    expect(trace.exitAt!).toBeLessThanOrEqual(25 * MIN);
  });

  // Spec R7 : le net de la semaine qui suit l'embauche est au moins celui d'avant, à 2, 4 et 6 clics / s,
  // en arrêtant de cliquer après l'IA et en partant de −2 000 €. Ce joueur peut sortir plus tard : on lui
  // laisse 40 min et on ne vérifie que la sortie (la fenêtre de 10 à 22 min vaut pour ceux qui cliquent).
  for (const cps of [2, 4, 6]) {
    for (const debt of [false, true]) {
      const name = `à ${cps} clics / s${debt ? ", départ à −2 000 €" : ""}, sans cliquer après l'IA`;
      it(`${name} : embaucher Nora ne fait pas baisser le net de la semaine suivante`, () => {
        const setup = debt ? (s: GameState) => void (s.money = D(-2000)) : undefined;
        const { s, trace } = playFreelance({ ...joueur(cps), stopsAfterAI: true }, 40 * MIN, setup);
        expect(trace.exitAt).not.toBeNull();
        const before = s.freelance.history.length;
        const lastNet = s.freelance.history[before - 1].net;
        expect(hireNora(s)).toBe(true);
        // la fin de la semaine en cours, puis une semaine entière avec Nora, toujours sans cliquer
        for (let t = 0; t < 2 * FL_WEEK_SECS && s.freelance.history.length < before + 2; t += 0.05) tick(s, 0.05);
        expect(s.freelance.history.length).toBe(before + 2);
        expect(s.freelance.history[before + 1].net).toBeGreaterThanOrEqual(lastNet);
      });
    }
  }
});
