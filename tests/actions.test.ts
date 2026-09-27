import { describe, it, expect } from "vitest";
import { D } from "../src/engine/numbers";
import { createInitialState, ENERGY_MAX } from "../src/engine/state";
import { work, buyGenerator, generatorCost, buyUpgrade, rest, promote, canPromote } from "../src/engine/actions";
import { JOBS } from "../src/engine/content/career";
import { UPGRADES_BY_ID } from "../src/engine/content/upgrades";

// Le chapitre plongeur (pile, équipement unique, études) est couvert par tests/plonge.test.ts.

describe("vie (métiers suivants)", () => {
  it("se reposer regagne de l'énergie (plafonné)", () => {
    const s = createInitialState(0);
    s.energy = 80;
    rest(s);
    expect(s.energy).toBe(ENERGY_MAX); // 80 + 40 plafonné à 100
  });
});

describe("carrière", () => {
  it("travailler en dev rapporte et coûte de l'énergie", () => {
    const s = createInitialState(0);
    s.job = "developpeur";
    s.flags.energyVisible = true;
    s.energy = 100;
    work(s);
    expect(s.money.toNumber()).toBeCloseTo(JOBS["developpeur"].clickValue.toNumber());
    expect(s.energy).toBe(100 - JOBS["developpeur"].clickEnergyCost);
  });
  it("un upgrade dev multiplie la valeur du clic", () => {
    const s = createInitialState(0);
    s.job = "developpeur";
    s.money = UPGRADES_BY_ID["ide"].cost;
    buyUpgrade(s, "ide");
    expect(s.devClickMult).toBe(UPGRADES_BY_ID["ide"].mulClickValue);
  });
  it("le pont IA pose les flags aiUnlocked puis aiResolving", () => {
    const s = createInitialState(0);
    s.job = "cto";
    s.money = UPGRADES_BY_ID["orchestrer_ia"].cost;
    buyUpgrade(s, "orchestrer_ia");
    expect(s.flags.aiUnlocked).toBe(true);
    s.money = UPGRADES_BY_ID["laisser_ia"].cost;
    buyUpgrade(s, "laisser_ia");
    expect(s.flags.aiResolving).toBe(true);
  });
  it("on ne promeut en lead qu'après 40 bugs et 2 missions (pas au capital)", () => {
    const s = createInitialState(0);
    s.job = "developpeur";
    s.money = D(1e6); // le capital seul ne débloque plus
    expect(canPromote(s)).toBe(false);
    s.bugsResolved = 40;
    s.missionsDone = 2;
    expect(canPromote(s)).toBe(true);
    expect(promote(s)).toBe(true);
    expect(s.job).toBe("lead_dev");
  });
  it("une promotion nettoie les événements éphémères de la phase quittée", () => {
    const s = createInitialState(0);
    s.job = "developpeur";
    s.money = D(1e6);
    s.bugsResolved = 40;
    s.missionsDone = 2;
    // Événements transitoires laissés actifs au moment de la promotion.
    s.mission = { tier: 0, progress: 3, timeLeft: 12 };
    s.incident = { timeLeft: 18 };
    s.badBuzz = { timeLeft: 15 };
    s.keynoteBoostLeft = 9;
    expect(promote(s)).toBe(true);
    // Rien de la phase précédente ne doit rester figé dans la nouvelle phase.
    expect(s.mission).toBeNull();
    expect(s.incident).toBeNull();
    expect(s.badBuzz).toBeNull();
    expect(s.keynoteBoostLeft).toBe(0);
  });
});

describe("entrepreneur (boîte d'IA)", () => {
  it("promu entrepreneur, l'Acte II se déclenche", () => {
    const s = createInitialState(0);
    s.job = "cto";
    s.money = D(30000);
    s.decisionIndex = 5; // les 5 décisions tranchées
    promote(s);
    expect(s.job).toBe("entrepreneur");
    expect(s.flags.act2).toBe(true);
  });
  it("une levée injecte du capital (cash one-shot)", () => {
    const s = createInitialState(0);
    s.job = "entrepreneur";
    s.money = D(80000);
    buyUpgrade(s, "leve_amorcage");
    expect(s.money.toNumber()).toBeCloseTo(80000 + 150000);
    expect(s.upgrades["leve_amorcage"]).toBe(true);
  });
  it("racheter une boîte ajoute des GPU au parc", () => {
    const s = createInitialState(0);
    s.job = "entrepreneur";
    s.generators["gpu"] = 3;
    s.money = generatorCost(s, "acquisition");
    buyGenerator(s, "acquisition");
    expect(s.generators["acquisition"]).toBe(1);
    expect(s.generators["gpu"]).toBe(5); // +2
  });
  it("le data center monte le boost GPU des produits", () => {
    const s = createInitialState(0);
    s.job = "entrepreneur";
    s.money = D(1500000);
    buyUpgrade(s, "data_center");
    expect(s.gpuProductBoost).toBeCloseTo(0.15);
  });
  it("engager une nounou pose le flag d'automatisation de la vie", () => {
    const s = createInitialState(0);
    s.job = "entrepreneur";
    s.money = D(120000);
    buyUpgrade(s, "nounou");
    expect(s.flags.vieAutomatisee).toBe(true);
  });
});
