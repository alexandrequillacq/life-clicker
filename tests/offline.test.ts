import { describe, it, expect } from "vitest";
import { createInitialState, ENERGY_MAX } from "../src/engine/state";
import { applyOffline, OFFLINE_CAP_SECONDS } from "../src/engine/offline";
import { GENERATORS_BY_ID } from "../src/engine/content/generators";

const LV = GENERATORS_BY_ID["lave_vaisselle"].dishesPerSec.toNumber();

describe("applyOffline", () => {
  it("crédite SEULEMENT les machines (pas le travail à la main)", () => {
    const s = createInitialState(0);
    s.generators["lave_vaisselle"] = 1;
    s.handWashing = true;
    s.handRate = 10; // ne doit PAS compter hors-ligne
    const r = applyOffline(s, 10_000); // 10 s
    const expected = LV * s.valuePerDish.toNumber() * 10;
    expect(r.earned.toNumber()).toBeCloseTo(expected);
    expect(s.money.toNumber()).toBeCloseTo(expected);
    expect(s.lastSeen).toBe(10_000);
  });
  it("plafonne le temps hors-ligne", () => {
    const s = createInitialState(0);
    s.generators["lave_vaisselle"] = 1;
    const r = applyOffline(s, (OFFLINE_CAP_SECONDS + 1000) * 1000);
    expect(r.seconds).toBeCloseTo(OFFLINE_CAP_SECONDS);
  });
  it("recharge l'énergie pendant l'absence", () => {
    const s = createInitialState(0);
    s.energy = 50;
    applyOffline(s, 100_000); // 100 s × 1/s → plafonné à 100
    expect(s.energy).toBe(ENERGY_MAX);
  });
  it("ne crédite rien sans machine", () => {
    const s = createInitialState(0);
    const r = applyOffline(s, 10_000);
    expect(r.earned.toNumber()).toBe(0);
  });
});
