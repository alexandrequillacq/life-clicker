import { describe, it, expect } from "vitest";
import { createInitialState, INCIDENT_PERIOD, INCIDENT_AUTO_RESOLVE, INCIDENT_ENERGY_COST } from "../src/engine/state";
import { devIncomePerSec } from "../src/engine/economy";
import { resolveIncident, canResolveIncident } from "../src/engine/actions";
import { tick } from "../src/engine/loop";

function leadState() {
  const s = createInitialState(0);
  s.job = "lead_dev";
  s.generators["junior"] = 1; // une équipe humaine
  s.energy = 100;
  return s;
}

describe("incidents (lead dev & CTO)", () => {
  it("un incident s'ouvre après INCIDENT_PERIOD (équipe > 0, sans IA)", () => {
    const s = leadState();
    expect(s.incident).toBeNull();
    tick(s, INCIDENT_PERIOD);
    expect(s.incident).not.toBeNull();
    expect(s.incident!.timeLeft).toBeCloseTo(INCIDENT_AUTO_RESOLVE);
  });

  it("les incidents touchent aussi le CTO", () => {
    const s = createInitialState(0);
    s.job = "cto";
    s.generators["junior"] = 1;
    tick(s, INCIDENT_PERIOD);
    expect(s.incident).not.toBeNull();
  });

  it("pendant un incident le brut d'équipe est divisé par 2, le net reste positif (junior et senior)", () => {
    const jr = createInitialState(0);
    jr.job = "cto";
    jr.generators["junior"] = 1;
    jr.incident = { timeLeft: 40 };
    expect(devIncomePerSec(jr).toNumber()).toBeCloseTo(14 * 0.5 - 6); // +1
    expect(devIncomePerSec(jr).toNumber()).toBeGreaterThan(0);

    const sr = createInitialState(0);
    sr.job = "cto";
    sr.generators["senior"] = 1;
    sr.incident = { timeLeft: 40 };
    expect(devIncomePerSec(sr).toNumber()).toBeCloseTo(45 * 0.5 - 18); // +4,5
    expect(devIncomePerSec(sr).toNumber()).toBeGreaterThan(0);
  });

  it("sans intervention, l'incident s'éteint seul au bout de INCIDENT_AUTO_RESOLVE et le timer repart", () => {
    const s = leadState();
    tick(s, INCIDENT_PERIOD); // ouvre
    expect(s.incident).not.toBeNull();
    tick(s, INCIDENT_AUTO_RESOLVE); // auto-extinction
    expect(s.incident).toBeNull();
  });

  it("résoudre l'incident coûte 10 énergie, le coupe et relance le timer", () => {
    const s = leadState();
    tick(s, INCIDENT_PERIOD);
    s.energy = 100;
    expect(canResolveIncident(s)).toBe(true);
    expect(resolveIncident(s)).toBe(true);
    expect(s.incident).toBeNull();
    expect(s.energy).toBe(100 - INCIDENT_ENERGY_COST);
    expect(s.incidentTimer).toBeCloseTo(INCIDENT_PERIOD);
  });

  it("résoudre refuse si l'énergie est insuffisante (laisse l'incident)", () => {
    const s = leadState();
    tick(s, INCIDENT_PERIOD);
    s.energy = INCIDENT_ENERGY_COST - 1;
    expect(canResolveIncident(s)).toBe(false);
    expect(resolveIncident(s)).toBe(false);
    expect(s.incident).not.toBeNull();
  });

  it("activer l'IA coupe tout incident en cours", () => {
    const s = leadState();
    tick(s, INCIDENT_PERIOD);
    expect(s.incident).not.toBeNull();
    s.flags.aiResolving = true;
    tick(s, 1);
    expect(s.incident).toBeNull();
  });

  it("sans équipe humaine, aucun incident", () => {
    const s = createInitialState(0);
    s.job = "lead_dev";
    tick(s, INCIDENT_PERIOD + 10);
    expect(s.incident).toBeNull();
  });

  it("invariant : érosion GPU et incident ne coexistent jamais (les GPU exigent l'IA, qui éteint les incidents)", () => {
    const s = createInitialState(0);
    s.job = "cto";
    s.generators["junior"] = 2;
    s.generators["gpu"] = 4; // érosion active
    s.flags.aiResolving = true; // requis pour posséder des GPU
    tick(s, INCIDENT_PERIOD + INCIDENT_AUTO_RESOLVE);
    expect(s.incident).toBeNull();
    // l'érosion GPU s'applique bien (brut réduit vs sans GPU)
    const eroded = devIncomePerSec(s).toNumber();
    const noGpu = createInitialState(0);
    noGpu.job = "cto";
    noGpu.generators["junior"] = 2;
    expect(eroded).toBeLessThan(devIncomePerSec(noGpu).toNumber());
  });
});
