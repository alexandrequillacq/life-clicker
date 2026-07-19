import { describe, it, expect } from "vitest";
import { D } from "../src/engine/numbers";
import { createInitialState } from "../src/engine/state";
import { decide, generatorCost, canPromote } from "../src/engine/actions";
import { devIncomePerSec, aiIncomePerSec } from "../src/engine/economy";
import { tick } from "../src/engine/loop";
import { DECISIONS } from "../src/engine/content/decisions";

function ctoState() {
  const s = createInitialState(0);
  s.job = "cto";
  return s;
}

describe("cartes de décision (CTO)", () => {
  it("5 cartes aux seuils de gains cumulés attendus", () => {
    expect(DECISIONS).toHaveLength(5);
    expect(DECISIONS.map((c) => c.threshold.toNumber())).toEqual([3500, 7000, 12000, 18000, 25000]);
  });

  it("le revenu positif alimente ctoEarned et arme la carte au seuil", () => {
    const s = ctoState();
    s.generators["senior"] = 200; // net = (45 - 18) × 200 = 5400 €/s
    expect(s.pendingDecision).toBe(false);
    tick(s, 1);
    expect(s.ctoEarned.toNumber()).toBeGreaterThan(3500);
    expect(s.pendingDecision).toBe(true);
  });

  it("carte 1 : « Migrer vers le cloud » (+15 % brut) vs « Monter ses propres serveurs » (−10 % coût GPU)", () => {
    const a = ctoState();
    a.pendingDecision = true;
    a.decisionIndex = 0;
    expect(decide(a, "A")).toBe(true);
    expect(a.teamOutputMult).toBeCloseTo(1.15);
    expect(a.decisionIndex).toBe(1);
    expect(a.pendingDecision).toBe(false);

    const b = ctoState();
    b.pendingDecision = true;
    b.decisionIndex = 0;
    decide(b, "B");
    expect(b.gpuCostMult).toBeCloseTo(0.9);
  });

  it("carte 2 A : incidents 2× plus rares ET auto-résolus en 10 s", () => {
    const s = ctoState();
    s.pendingDecision = true;
    s.decisionIndex = 1;
    decide(s, "A");
    expect(s.incidentPeriodMult).toBeCloseTo(2);
    expect(s.incidentAutoResolveSecs).toBe(10);
  });

  it("carte 2 B : +10 % brut", () => {
    const s = ctoState();
    s.pendingDecision = true;
    s.decisionIndex = 1;
    decide(s, "B");
    expect(s.teamOutputMult).toBeCloseTo(1.1);
  });

  it("carte 3 A « Payer la dette technique » refuse sans les 2 000 € et laisse la carte en attente", () => {
    const s = ctoState();
    s.pendingDecision = true;
    s.decisionIndex = 2;
    s.money = D(1000);
    expect(decide(s, "A")).toBe(false);
    expect(s.pendingDecision).toBe(true);
    expect(s.decisionIndex).toBe(2);
    expect(s.teamOutputMult).toBeCloseTo(1);
  });

  it("carte 3 A paie 2 000 € et donne +20 % brut", () => {
    const s = ctoState();
    s.pendingDecision = true;
    s.decisionIndex = 2;
    s.money = D(5000);
    expect(decide(s, "A")).toBe(true);
    expect(s.money.toNumber()).toBeCloseTo(3000);
    expect(s.teamOutputMult).toBeCloseTo(1.2);
  });

  it("carte 3 B encaisse 2 500 € et double la fréquence des incidents", () => {
    const s = ctoState();
    s.pendingDecision = true;
    s.decisionIndex = 2;
    s.money = D(0);
    decide(s, "B");
    expect(s.money.toNumber()).toBeCloseTo(2500);
    expect(s.incidentPeriodMult).toBeCloseTo(0.5);
  });

  it("carte 4 : « Standardiser l'outillage » (−10 % embauches) vs « Laisser chacun choisir » (+5 % brut)", () => {
    const a = ctoState();
    a.pendingDecision = true;
    a.decisionIndex = 3;
    decide(a, "A");
    expect(a.hireCostMult).toBeCloseTo(0.9);

    const b = ctoState();
    b.pendingDecision = true;
    b.decisionIndex = 3;
    decide(b, "B");
    expect(b.teamOutputMult).toBeCloseTo(1.05);
  });

  it("carte 5 : « Former l'équipe à l'IA » (−25 % érosion) vs « Garder l'IA pour l'infra » (+15 % débit IA)", () => {
    const a = ctoState();
    a.pendingDecision = true;
    a.decisionIndex = 4;
    decide(a, "A");
    expect(a.gpuErosionMult).toBeCloseTo(0.75);

    const b = ctoState();
    b.pendingDecision = true;
    b.decisionIndex = 4;
    decide(b, "B");
    expect(b.aiRateMult).toBeCloseTo(1.15);
  });

  it("decide refuse s'il n'y a pas de carte en attente", () => {
    const s = ctoState();
    expect(decide(s, "A")).toBe(false);
  });
});

describe("effets déclaratifs sur l'économie et les coûts", () => {
  it("teamOutputMult augmente le brut d'équipe", () => {
    const s = ctoState();
    s.generators["junior"] = 1; // net défaut : 14 − 6 = 8
    s.teamOutputMult = 1.15;
    expect(devIncomePerSec(s).toNumber()).toBeCloseTo(14 * 1.15 - 6);
  });

  it("gpuErosionMult réduit l'érosion GPU (donc remonte le net)", () => {
    const s = ctoState();
    s.generators["junior"] = 1;
    s.generators["gpu"] = 4;
    s.flags.aiResolving = true;
    const eroded = devIncomePerSec(s).toNumber();
    s.gpuErosionMult = 0.75;
    expect(devIncomePerSec(s).toNumber()).toBeGreaterThan(eroded);
  });

  it("aiRateMult augmente le débit de l'IA", () => {
    const s = ctoState();
    s.flags.aiResolving = true;
    s.generators["gpu"] = 2;
    const base = aiIncomePerSec(s).toNumber();
    s.aiRateMult = 1.15;
    expect(aiIncomePerSec(s).toNumber()).toBeCloseTo(base * 1.15);
  });

  it("gpuCostMult réduit le coût du GPU, hireCostMult celui des embauches", () => {
    const s = ctoState();
    const baseGpu = generatorCost(s, "gpu").toNumber();
    const baseHire = generatorCost(s, "junior").toNumber();
    s.gpuCostMult = 0.9;
    s.hireCostMult = 0.9;
    expect(generatorCost(s, "gpu").toNumber()).toBeCloseTo(baseGpu * 0.9);
    expect(generatorCost(s, "junior").toNumber()).toBeCloseTo(baseHire * 0.9);
  });
});

describe("gate CTO → fondateur", () => {
  it("exige 30 000 € ET les 5 décisions tranchées", () => {
    const s = ctoState();
    s.money = D(30000);
    s.decisionIndex = 4;
    expect(canPromote(s)).toBe(false);
    s.decisionIndex = 5;
    expect(canPromote(s)).toBe(true);
    s.money = D(29999);
    expect(canPromote(s)).toBe(false);
  });
});
