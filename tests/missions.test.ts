import { describe, it, expect } from "vitest";
import { D } from "../src/engine/numbers";
import { createInitialState } from "../src/engine/state";
import { work, promote, canPromote } from "../src/engine/actions";
import { tick } from "../src/engine/loop";
import { MISSIONS, MISSION_PERIOD, MISSION_WINDOW, missionTier } from "../src/engine/content/missions";
import { JOBS, LEAD_HIRING_BONUS } from "../src/engine/content/career";

function devState() {
  const s = createInitialState(0);
  s.job = "developpeur";
  s.flags.energyVisible = true;
  s.energy = 100000; // assez pour cliquer librement dans les tests
  return s;
}

describe("missions freelance (développeur)", () => {
  it("3 paliers auteurés (bugs / prime)", () => {
    expect(MISSIONS).toHaveLength(3);
    expect(MISSIONS[0]).toMatchObject({ label: "Livrer un site vitrine", bugs: 10, prime: 25 });
    expect(MISSIONS[1]).toMatchObject({ label: "Livrer une appli mobile", bugs: 15, prime: 60 });
    expect(MISSIONS[2]).toMatchObject({ label: "Livrer une migration legacy", bugs: 20, prime: 150 });
  });

  it("le palier proposé = min(missionsDone, 2)", () => {
    expect(missionTier(0)).toBe(0);
    expect(missionTier(1)).toBe(1);
    expect(missionTier(2)).toBe(2);
    expect(missionTier(5)).toBe(2);
  });

  it("le clic dev incrémente bugsResolved", () => {
    const s = devState();
    work(s);
    work(s);
    expect(s.bugsResolved).toBe(2);
  });

  it("aucune mission tant qu'on n'a pas résolu 10 bugs", () => {
    const s = devState();
    s.bugsResolved = 9;
    tick(s, MISSION_PERIOD + 5);
    expect(s.mission).toBeNull();
  });

  it("à 10 bugs, une mission s'ouvre après MISSION_PERIOD (palier 0, fenêtre MISSION_WINDOW)", () => {
    const s = devState();
    s.bugsResolved = 10;
    tick(s, MISSION_PERIOD);
    expect(s.mission).not.toBeNull();
    expect(s.mission!.tier).toBe(0);
    expect(s.mission!.progress).toBe(0);
    expect(s.mission!.timeLeft).toBeCloseTo(MISSION_WINDOW);
  });

  it("le palier de la mission suit missionsDone", () => {
    const s = devState();
    s.bugsResolved = 10;
    s.missionsDone = 5;
    tick(s, MISSION_PERIOD);
    expect(s.mission!.tier).toBe(2);
  });

  it("résoudre assez de bugs pendant la mission verse la prime et incrémente missionsDone", () => {
    const s = devState();
    s.bugsResolved = 10;
    tick(s, MISSION_PERIOD); // mission palier 0 (10 bugs, 25 €)
    const before = s.money.toNumber();
    const need = MISSIONS[0].bugs;
    for (let i = 0; i < need; i++) work(s);
    expect(s.mission).toBeNull();
    expect(s.missionsDone).toBe(1);
    // gains = clics (need × clickValue) + prime
    const clickGain = need * JOBS.developpeur.clickValue.toNumber();
    expect(s.money.toNumber()).toBeCloseTo(before + clickGain + MISSIONS[0].prime);
  });

  it("une mission non livrée expire à la fin de la fenêtre, sans prime, et le timer repart", () => {
    const s = devState();
    s.bugsResolved = 10;
    tick(s, MISSION_PERIOD); // ouvre
    expect(s.mission).not.toBeNull();
    tick(s, MISSION_WINDOW + 1); // expire
    expect(s.mission).toBeNull();
    expect(s.missionsDone).toBe(0);
    // une nouvelle mission se rouvre après MISSION_PERIOD
    tick(s, MISSION_PERIOD);
    expect(s.mission).not.toBeNull();
  });
});

describe("gate développeur → lead + prime d'embauche", () => {
  it("exige 40 bugs ET 2 missions, indépendamment du capital", () => {
    const s = createInitialState(0);
    s.job = "developpeur";
    s.money = D(1e9); // beaucoup d'argent ne suffit pas
    expect(canPromote(s)).toBe(false);
    s.bugsResolved = 40;
    s.missionsDone = 1;
    expect(canPromote(s)).toBe(false);
    s.bugsResolved = 39;
    s.missionsDone = 2;
    expect(canPromote(s)).toBe(false);
    s.bugsResolved = 40;
    s.missionsDone = 2;
    expect(canPromote(s)).toBe(true);
  });

  it("accepter le poste de lead verse la prime d'embauche", () => {
    const s = createInitialState(0);
    s.job = "developpeur";
    s.bugsResolved = 40;
    s.missionsDone = 2;
    const before = s.money.toNumber();
    expect(promote(s)).toBe(true);
    expect(s.job).toBe("lead_dev");
    expect(s.money.toNumber()).toBeCloseTo(before + LEAD_HIRING_BONUS);
  });
});
