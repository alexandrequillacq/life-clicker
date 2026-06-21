import { describe, it, expect } from "vitest";
import { createInitialState } from "../src/engine/state";
import { applyOffline, OFFLINE_CAP_SECONDS } from "../src/engine/offline";

describe("applyOffline", () => {
  it("crédite la production sur le temps écoulé", () => {
    const s = createInitialState(0);
    s.generators["collegue"] = 1; // 0.1 €/s
    const r = applyOffline(s, 10_000); // 10 s
    expect(r.seconds).toBeCloseTo(10);
    expect(r.earned.toNumber()).toBeCloseTo(1);
    expect(s.money.toNumber()).toBeCloseTo(1);
    expect(s.lastSeen).toBe(10_000);
  });
  it("plafonne le temps hors-ligne", () => {
    const s = createInitialState(0);
    s.generators["collegue"] = 1;
    const r = applyOffline(s, (OFFLINE_CAP_SECONDS + 1000) * 1000);
    expect(r.seconds).toBeCloseTo(OFFLINE_CAP_SECONDS);
  });
  it("ne crédite rien sans générateur", () => {
    const s = createInitialState(0);
    const r = applyOffline(s, 10_000);
    expect(r.earned.toNumber()).toBe(0);
  });
});
