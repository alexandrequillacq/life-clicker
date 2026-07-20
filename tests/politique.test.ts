import { describe, it, expect } from "vitest";
import { D } from "../src/engine/numbers";
import {
  createInitialState,
  MEETING_COOLDOWN,
  MEETING_ENERGY_COST,
  MEETING_MIN_FOLLOWERS,
} from "../src/engine/state";
import { canHoldMeeting, holdMeeting } from "../src/engine/actions";
import { tick } from "../src/engine/loop";
import { JOBS } from "../src/engine/content/career";

function politician(): ReturnType<typeof createInitialState> {
  const s = createInitialState(0);
  s.job = "politique";
  s.energy = 100;
  s.followers = D(50_000_000);
  s.maxFollowers = D(50_000_000);
  return s;
}

describe("Meeting politique : conversion followers → Emprise", () => {
  it("le libellé de clic politique « Tenir un meeting » revit", () => {
    expect(JOBS.politique.clickLabel).toBe("Tenir un meeting");
  });

  it("un meeting brûle 2 % des followers courants et les convertit en Emprise", () => {
    const s = politician();
    expect(canHoldMeeting(s)).toBe(true);
    expect(holdMeeting(s)).toBe(true);
    // 2 % de 50 M = 1 M consommés → 1 M × 0,002 = 2 000 Emprise.
    expect(s.followers.toNumber()).toBeCloseTo(49_000_000);
    expect(s.emprise.toNumber()).toBeCloseTo(2_000);
    expect(s.energy).toBe(100 - MEETING_ENERGY_COST);
    expect(s.meetingCooldown).toBeCloseTo(MEETING_COOLDOWN);
  });

  it("consomme au minimum le plancher de 10 000 followers", () => {
    const s = politician();
    s.followers = D(MEETING_MIN_FOLLOWERS); // 2 % = 200 < plancher
    holdMeeting(s);
    expect(s.followers.toNumber()).toBeCloseTo(0);
    expect(s.emprise.toNumber()).toBeCloseTo(MEETING_MIN_FOLLOWERS * 0.002);
  });

  it("le pic historique de followers n'est jamais rongé par un meeting", () => {
    const s = politician();
    holdMeeting(s);
    expect(s.maxFollowers.toNumber()).toBeCloseTo(50_000_000);
  });

  it("refuse hors politique, en cooldown, sans énergie, ou sous le plancher de followers", () => {
    const dev = createInitialState(0);
    dev.job = "developpeur";
    dev.followers = D(50_000_000);
    dev.energy = 100;
    expect(canHoldMeeting(dev)).toBe(false);

    const cd = politician();
    cd.meetingCooldown = 5;
    expect(canHoldMeeting(cd)).toBe(false);

    const tired = politician();
    tired.energy = MEETING_ENERGY_COST - 1;
    expect(canHoldMeeting(tired)).toBe(false);

    const poor = politician();
    poor.followers = D(MEETING_MIN_FOLLOWERS - 1);
    expect(canHoldMeeting(poor)).toBe(false);
    expect(holdMeeting(poor)).toBe(false);
  });

  it("la boucle décompte le cooldown de meeting", () => {
    const s = politician();
    holdMeeting(s);
    expect(s.meetingCooldown).toBeCloseTo(MEETING_COOLDOWN);
    tick(s, MEETING_COOLDOWN + 1);
    expect(s.meetingCooldown).toBe(0);
    expect(canHoldMeeting(s)).toBe(true);
  });
});
