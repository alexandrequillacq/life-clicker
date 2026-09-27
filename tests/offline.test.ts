import { describe, it, expect } from "vitest";
import { createInitialState, ENERGY_MAX } from "../src/engine/state";
import { applyOffline, OFFLINE_CAP_SECONDS } from "../src/engine/offline";
import { GENERATORS_BY_ID } from "../src/engine/content/generators";

// Le hors-ligne du plongeur (plafonné à 10 min, limité par l'affluence) : tests/plonge.test.ts.

const JUNIOR = GENERATORS_BY_ID["junior"];
const JUNIOR_NET = JUNIOR.output.sub(JUNIOR.salaryPerSec!).toNumber();

function lead() {
  const s = createInitialState(0);
  s.job = "lead_dev";
  return s;
}

describe("applyOffline", () => {
  it("crédite le revenu passif de l'absence", () => {
    const s = lead();
    s.generators["junior"] = 1;
    const r = applyOffline(s, 10_000); // 10 s
    expect(r.earned.toNumber()).toBeCloseTo(JUNIOR_NET * 10);
    expect(s.money.toNumber()).toBeCloseTo(JUNIOR_NET * 10);
    expect(s.lastSeen).toBe(10_000);
  });
  it("plafonne le temps hors-ligne", () => {
    const s = lead();
    s.generators["junior"] = 1;
    const r = applyOffline(s, (OFFLINE_CAP_SECONDS + 1000) * 1000);
    expect(r.seconds).toBeCloseTo(OFFLINE_CAP_SECONDS);
  });
  it("recharge l'énergie pendant l'absence", () => {
    const s = lead();
    s.energy = 50;
    applyOffline(s, 100_000);
    expect(s.energy).toBe(ENERGY_MAX);
  });
  it("ne crédite rien sans revenu passif", () => {
    const s = createInitialState(0);
    const r = applyOffline(s, 10_000);
    expect(r.earned.toNumber()).toBe(0);
  });
});
