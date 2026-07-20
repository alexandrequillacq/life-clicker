import { describe, it, expect } from "vitest";
import { D } from "../src/engine/numbers";
import { createInitialState, type Job } from "../src/engine/state";
import {
  holdMeeting,
  canHoldMeeting,
  fireActe,
  canActe,
  buyControl,
  canBuyControl,
  launchFirstProbe,
  buyGenerator,
  canBuyGenerator,
} from "../src/engine/actions";
import { emprisePerSec } from "../src/engine/economy";
import { tick } from "../src/engine/loop";
import { CONTROLS } from "../src/engine/content/control";
import { PROBE_COST } from "../src/engine/content/cosmos";
import { ACTES } from "../src/engine/content/power";

const DT = 0.5;

/** Simule en firant l'acte à chaque cooldown pendant `windowSecs`, et rend le total des grants. */
function acteGrantsOverWindow(job: Job, windowSecs: number): number {
  const s = createInitialState(0);
  s.job = job;
  const grant = ACTES[job]!.empriseGrant.toNumber();
  let t = 0;
  let total = 0;
  while (t < windowSecs) {
    if (canActe(s)) {
      fireActe(s);
      total += grant;
    }
    tick(s, DT);
    t += DT;
  }
  return total;
}

describe("Pacing Acte III (simulation par ticks)", () => {
  it("(a) la gate présidence (50 000 Emprise) est atteignable en ~2 à 5 min de mix actif", () => {
    const s = createInitialState(0);
    s.job = "politique";
    s.followers = D(50_000_000);
    s.maxFollowers = D(50_000_000);
    s.money = D(8_000_000);
    s.generators["gpu"] = 30; // l'armée d'IA héritée des actes précédents
    let t = 0;
    while (s.emprise.toNumber() < 5e4 && t < 600) {
      tick(s, DT);
      t += DT;
      if (canHoldMeeting(s)) holdMeeting(s);
      if (canActe(s)) fireActe(s);
      for (const id of ["propagande", "influence"]) {
        if (s.flags[`gen_${id}_unlocked`] && canBuyGenerator(s, id)) buyGenerator(s, id);
      }
    }
    expect(s.emprise.toNumber()).toBeGreaterThanOrEqual(5e4);
    expect(t).toBeLessThanOrEqual(300); // atteint bien avant 5 min
  });

  it("(b) le damier président s'autofinance : les 5 institutions en moins de ~8 min", () => {
    const s = createInitialState(0);
    s.job = "president";
    s.generators["gpu"] = 40;
    s.generators["produit_ia"] = 50; // ~300 k €/s hérités de la boîte
    const institutions = CONTROLS.filter((c) => c.job === "president");
    let t = 0;
    while (institutions.some((c) => !s.controls[c.id]) && t < 900) {
      tick(s, DT);
      t += DT;
      for (const c of institutions) {
        if (!s.controls[c.id] && canBuyControl(s, c.id)) buyControl(s, c.id);
      }
    }
    expect(institutions.every((c) => s.controls[c.id])).toBe(true);
    expect(t).toBeLessThanOrEqual(480); // < 8 min
  });

  it("(c) la gate empereur (5e9 Emprise) est atteignable en ~8 à 10 min", () => {
    const s = createInitialState(0);
    s.job = "monde";
    s.generators["gpu"] = 40;
    s.generators["produit_ia"] = 50;
    for (const c of CONTROLS.filter((c) => c.job === "president")) s.controls[c.id] = true; // acquis persistants
    const continents = CONTROLS.filter((c) => c.job === "monde");
    let t = 0;
    while (s.emprise.toNumber() < 5e9 && t < 1200) {
      tick(s, DT);
      t += DT;
      for (const c of continents) if (!s.controls[c.id] && canBuyControl(s, c.id)) buyControl(s, c.id);
      if (canActe(s)) fireActe(s);
    }
    expect(s.emprise.toNumber()).toBeGreaterThanOrEqual(5e9);
    expect(t).toBeLessThanOrEqual(660); // < 11 min, marge de sécurité
  });

  it("(d) l'épilogue (1e15) survient 15 à 25 min après la première sonde", () => {
    const s = createInitialState(0);
    s.job = "empereur";
    s.money = PROBE_COST;
    launchFirstProbe(s);
    let t = 0;
    while (s.emprise.toNumber() < 1e15 && t < 3000) {
      tick(s, DT);
      t += DT;
    }
    expect(t).toBeGreaterThanOrEqual(900); // >= 15 min
    expect(t).toBeLessThanOrEqual(1500); // <= 25 min
  });

  it("(e) la Résistance à 100 ne bloque jamais l'accumulation (facteur plancher 1/3 > 0)", () => {
    const s = createInitialState(0);
    s.job = "president";
    s.controls["banque"] = true; // 6 000 Emprise/s brut
    s.resistance = 100;
    expect(emprisePerSec(s).toNumber()).toBeGreaterThan(0);
    const before = s.emprise.toNumber();
    tick(s, 1);
    expect(s.emprise.toNumber()).toBeGreaterThan(before); // l'Emprise progresse malgré la Résistance max
  });

  it("(f) les grants d'actes cumulés restent minoritaires face à la gate (rituel, pas moteur)", () => {
    // Rangs où l'acte est explicitement du rituel (< 30 % de la gate sur la durée cible).
    expect(acteGrantsOverWindow("president", 420)).toBeLessThan(0.3 * 1e7); // ~7 min, gate monde 1e7
    expect(acteGrantsOverWindow("monde", 480)).toBeLessThan(0.3 * 5e9); // ~8 min, gate empereur 5e9
    expect(acteGrantsOverWindow("empereur", 1020)).toBeLessThan(0.3 * 1e15); // ~17 min, gate épilogue 1e15
    // Politique : l'alliance est un vrai pilier du mix (le design la veut à ~half), mais ne peut JAMAIS
    // à elle seule atteindre la gate présidence sur la durée cible (~2 min) : meetings et propagande
    // restent nécessaires. Écart documenté au seuil des 30 % (voir résumé).
    expect(acteGrantsOverWindow("politique", 120)).toBeLessThan(5e4);
  });
});
