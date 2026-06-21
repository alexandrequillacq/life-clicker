import { describe, it, expect } from "vitest";
import { createInitialState } from "../src/engine/state";
import { clickWork, buyGenerator, generatorCost, canBuyGenerator } from "../src/engine/actions";

describe("actions P0", () => {
  it("clickWork ajoute le revenu par clic", () => {
    const s = createInitialState(0);
    clickWork(s);
    expect(s.money.toNumber()).toBeCloseTo(0.05);
    expect(s.totalClicks).toBe(1);
  });
  it("buyGenerator échoue si l'argent manque", () => {
    const s = createInitialState(0);
    expect(buyGenerator(s, "collegue")).toBe(false);
    expect(s.generators["collegue"]).toBeUndefined();
  });
  it("buyGenerator débite et incrémente quand abordable", () => {
    const s = createInitialState(0);
    s.money = generatorCost(s, "collegue");
    expect(canBuyGenerator(s, "collegue")).toBe(true);
    expect(buyGenerator(s, "collegue")).toBe(true);
    expect(s.generators["collegue"]).toBe(1);
    expect(s.money.toNumber()).toBeCloseTo(0);
  });
});
