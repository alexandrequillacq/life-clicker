import { describe, it, expect } from "vitest";
import { createInitialState, ENERGY_MAX } from "../src/engine/state";
import { tick, updateFlags } from "../src/engine/loop";
import { GENERATORS_BY_ID } from "../src/engine/content/generators";

// Le chapitre plongeur (pile finie, fatigue des mains, études) a son propre moteur : tests/plonge.test.ts.

const JUNIOR = GENERATORS_BY_ID["junior"];
const JUNIOR_NET = JUNIOR.output.sub(JUNIOR.salaryPerSec!).toNumber();

function lead() {
  const s = createInitialState(0);
  s.job = "lead_dev";
  s.incidentTimer = 1e9; // pas d'incident pendant la mesure
  return s;
}

describe("tick : revenu", () => {
  it("les générateurs produisent du revenu", () => {
    const s = lead();
    s.generators["junior"] = 2;
    tick(s, 10);
    expect(s.money.toNumber()).toBeCloseTo(2 * JUNIOR_NET * 10);
  });
  it("le tempo accélère le temps", () => {
    const s = lead();
    s.generators["junior"] = 1;
    s.tempo = 2;
    tick(s, 10); // ×2 → 20 s
    expect(s.money.toNumber()).toBeCloseTo(JUNIOR_NET * 20);
  });
});

describe("tick : énergie (hors plonge)", () => {
  it("régénère en continu", () => {
    const s = lead();
    s.flags.energyVisible = true;
    s.energy = 50;
    tick(s, 10); // +3/s × 10
    expect(s.energy).toBeCloseTo(80);
  });
  it("plafonnée à 100", () => {
    const s = lead();
    s.flags.energyVisible = true;
    s.energy = 95;
    tick(s, 10);
    expect(s.energy).toBe(ENERGY_MAX);
  });
});

describe("révélation progressive", () => {
  it("compteur révélé après un clic", () => {
    const s = createInitialState(0);
    s.totalClicks = 1;
    updateFlags(s);
    expect(s.flags.moneyVisible).toBe(true);
  });
  it("énergie révélée dès le continu à la main", () => {
    const s = createInitialState(0);
    s.handWashing = true;
    updateFlags(s);
    expect(s.flags.energyVisible).toBe(true);
  });
  it("la Vie (métiers suivants) est acquise une fois la plonge quittée", () => {
    const s = createInitialState(0);
    updateFlags(s);
    expect(s.flags.lifeVisible).toBeFalsy();
    s.job = "developpeur";
    updateFlags(s);
    expect(s.flags.lifeVisible).toBe(true);
  });
});
