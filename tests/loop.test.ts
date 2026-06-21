import { describe, it, expect } from "vitest";
import { createInitialState } from "../src/engine/state";
import { tick, updateFlags } from "../src/engine/loop";
import { production } from "../src/engine/economy";
import { D } from "../src/engine/numbers";

describe("loop", () => {
  it("production = 0 sans générateur", () => {
    const s = createInitialState(0);
    expect(production(s).toNumber()).toBe(0);
  });
  it("tick accumule la production sur dt", () => {
    const s = createInitialState(0);
    s.generators["collegue"] = 2; // 2 × 0.1 = 0.2 €/s
    tick(s, 10); // 10 s
    expect(s.money.toNumber()).toBeCloseTo(2);
  });
  it("le tempo accélère le temps", () => {
    const s = createInitialState(0);
    s.generators["collegue"] = 1; // 0.1 €/s
    s.tempo = 2;
    tick(s, 10); // 10 s × 2 = 20 s → 2 €
    expect(s.money.toNumber()).toBeCloseTo(2);
  });
  it("updateFlags révèle le compteur après un clic", () => {
    const s = createInitialState(0);
    s.totalClicks = 1;
    updateFlags(s);
    expect(s.flags.moneyVisible).toBe(true);
  });
  it("updateFlags débloque le générateur au seuil", () => {
    const s = createInitialState(0);
    s.money = D(0.5);
    updateFlags(s);
    expect(s.flags["gen_collegue_unlocked"]).toBe(true);
  });
});
