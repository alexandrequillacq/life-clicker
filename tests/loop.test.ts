import { describe, it, expect } from "vitest";
import { D } from "../src/engine/numbers";
import { createInitialState, ENERGY_MAX } from "../src/engine/state";
import { tick, updateFlags } from "../src/engine/loop";
import { GENERATORS_BY_ID } from "../src/engine/content/generators";
import { STUDY_THRESHOLD } from "../src/engine/content/studies";

const LV = GENERATORS_BY_ID["lave_vaisselle"].dishesPerSec.toNumber();

describe("tick : revenu", () => {
  it("les machines produisent du revenu", () => {
    const s = createInitialState(0);
    s.generators["lave_vaisselle"] = 2;
    tick(s, 10);
    const expected = 2 * LV * s.valuePerDish.toNumber() * 10;
    expect(s.money.toNumber()).toBeCloseTo(expected);
  });
  it("le tempo accélère le temps", () => {
    const s = createInitialState(0);
    s.generators["lave_vaisselle"] = 1;
    s.tempo = 2;
    tick(s, 10); // ×2 → 20 s
    const expected = LV * s.valuePerDish.toNumber() * 10 * 2;
    expect(s.money.toNumber()).toBeCloseTo(expected);
  });
});

describe("tick : énergie", () => {
  it("le continu intensif fait chuter l'énergie (drain ∝ débit)", () => {
    const s = createInitialState(0);
    s.handWashing = true;
    s.handRate = 10; // drain plein = 0,5 × 10 = 5/s > regen 3/s
    s.flags.energyVisible = true;
    tick(s, 1); // net (3 - 5) = -2 → 98
    expect(s.energy).toBeCloseTo(98);
  });
  it("régénère quand on ne lave pas en continu", () => {
    const s = createInitialState(0);
    s.flags.energyVisible = true;
    s.energy = 50;
    tick(s, 10); // +3/s × 10 → plafonné à 80
    expect(s.energy).toBeCloseTo(80);
  });
  it("plafonnée à 100", () => {
    const s = createInitialState(0);
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
  it("« Poser les gants » proposé à 2 machines", () => {
    const s = createInitialState(0);
    s.generators["lave_vaisselle"] = 2;
    updateFlags(s);
    expect(s.flags.poseGantsVisible).toBe(true);
  });
  it("la Vie apparaît une fois les gants posés", () => {
    const s = createInitialState(0);
    s.manualRetired = true;
    updateFlags(s);
    expect(s.flags.lifeVisible).toBe(true);
  });
  it("les études s'ouvrent une fois la Vie là", () => {
    const s = createInitialState(0);
    s.flags.lifeVisible = true;
    updateFlags(s);
    expect(s.flags.studyVisible).toBe(true);
  });
  it("« Postuler » s'ouvre au seuil d'études", () => {
    const s = createInitialState(0);
    s.studyLevel = STUDY_THRESHOLD;
    updateFlags(s);
    expect(s.flags.postulerVisible).toBe(true);
  });
  it("machine révélée au seuil d'argent", () => {
    const s = createInitialState(0);
    s.money = D(40);
    updateFlags(s);
    expect(s.flags["gen_lave_vaisselle_unlocked"]).toBe(true);
  });
});
