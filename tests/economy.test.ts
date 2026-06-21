import { describe, it, expect } from "vitest";
import { D } from "../src/engine/numbers";
import {
  costOf,
  machineDishesPerSec,
  dishesPerMinute,
  incomePerSec,
  aiIncomePerSec,
  energyFactor,
} from "../src/engine/economy";
import { createInitialState } from "../src/engine/state";
import { GENERATORS_BY_ID, AI_BASE_INCOME, GPU_MULT_PER_UNIT } from "../src/engine/content/generators";

const LV = GENERATORS_BY_ID["lave_vaisselle"].output.toNumber();

describe("costOf", () => {
  it("vaut le prix de base quand rien n'est possédé", () => {
    expect(costOf(D(10), 1.15, 0).toNumber()).toBeCloseTo(10);
  });
  it("croît de ×1,15 par unité possédée", () => {
    expect(costOf(D(10), 1.15, 1).toNumber()).toBeCloseTo(11.5);
  });
  it("somme un achat groupé (série géométrique)", () => {
    expect(costOf(D(10), 1.15, 0, 2).toNumber()).toBeCloseTo(21.5);
  });
});

describe("débit & revenu", () => {
  it("1 lave-vaisselle produit son débit en assiettes/s", () => {
    const s = createInitialState(0);
    s.generators["lave_vaisselle"] = 1;
    expect(machineDishesPerSec(s).toNumber()).toBeCloseTo(LV);
  });
  it("assiettes/min agrège machines + main", () => {
    const s = createInitialState(0);
    s.generators["lave_vaisselle"] = 1;
    s.handWashing = true;
    s.handRate = 2; // +2/s (énergie pas en jeu → ×1)
    expect(dishesPerMinute(s).toNumber()).toBeCloseTo((LV + 2) * 60);
  });
  it("revenu/s = débit × valeur par assiette", () => {
    const s = createInitialState(0);
    s.generators["lave_vaisselle"] = 1;
    expect(incomePerSec(s).toNumber()).toBeCloseTo(LV * s.valuePerDish.toNumber());
  });
  it("energyFactor vaut 1 tant que l'énergie n'est pas en jeu, puis fraction", () => {
    const s = createInitialState(0);
    s.energy = 50;
    expect(energyFactor(s)).toBe(1);
    s.flags.energyVisible = true;
    expect(energyFactor(s)).toBeCloseTo(0.5);
  });
});

describe("revenu IA (GPU)", () => {
  it("nul tant que l'IA n'est pas activée", () => {
    const s = createInitialState(0);
    s.generators["gpu"] = 5;
    expect(aiIncomePerSec(s).toNumber()).toBe(0);
  });
  it("socle de base une fois l'IA activée", () => {
    const s = createInitialState(0);
    s.flags.aiResolving = true;
    expect(aiIncomePerSec(s).toNumber()).toBeCloseTo(AI_BASE_INCOME);
  });
  it("chaque GPU multiplie le débit de l'IA", () => {
    const s = createInitialState(0);
    s.flags.aiResolving = true;
    s.generators["gpu"] = 4;
    expect(aiIncomePerSec(s).toNumber()).toBeCloseTo(AI_BASE_INCOME * (1 + GPU_MULT_PER_UNIT * 4));
  });
});
