import { describe, it, expect } from "vitest";
import { createInitialState, SAVE_VERSION, ENERGY_MAX } from "../src/engine/state";

describe("createInitialState", () => {
  it("démarre à 0 €, 1 assiette/clic à 0,05 €", () => {
    const s = createInitialState(1000);
    expect(s.money.toNumber()).toBe(0);
    expect(s.valuePerDish.toNumber()).toBeCloseTo(0.05);
    expect(s.dishesPerClick).toBe(1);
  });
  it("énergie pleine, pas de continu, rien d'automatisé", () => {
    const s = createInitialState(1000);
    expect(s.energy).toBe(ENERGY_MAX);
    expect(s.handWashing).toBe(false);
    expect(s.manualRetired).toBe(false);
    expect(s.generators).toEqual({});
    expect(s.upgrades).toEqual({});
  });
  it("méta-champs", () => {
    const s = createInitialState(1000);
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.tempo).toBe(1);
    expect(s.startedAt).toBe(1000);
    expect(s.lastSeen).toBe(1000);
    expect(s.totalClicks).toBe(0);
  });
});
