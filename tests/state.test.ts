import { describe, it, expect } from "vitest";
import { createInitialState, SAVE_VERSION } from "../src/engine/state";

describe("createInitialState", () => {
  it("démarre à 0 € avec 0.05 €/clic", () => {
    const s = createInitialState(1000);
    expect(s.money.toNumber()).toBe(0);
    expect(s.perClick.toNumber()).toBeCloseTo(0.05);
  });
  it("initialise les méta-champs", () => {
    const s = createInitialState(1000);
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.tempo).toBe(1);
    expect(s.startedAt).toBe(1000);
    expect(s.lastSeen).toBe(1000);
    expect(s.totalClicks).toBe(0);
    expect(s.generators).toEqual({});
    expect(s.flags).toEqual({});
  });
});
