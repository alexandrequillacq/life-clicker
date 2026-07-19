import { describe, it, expect } from "vitest";
import { D } from "../src/engine/numbers";
import { createInitialState } from "../src/engine/state";
import { tick } from "../src/engine/loop";
import {
  work,
  answerBadBuzz,
  canAnswerBadBuzz,
  canPromote,
  promote,
} from "../src/engine/actions";
import {
  FOLLOWERS_PER_POST,
  POST_FOLLOWERS_SHARE,
  TREND_PERIOD,
  TREND_WINDOW,
  TREND_MULT,
  BADBUZZ_PERIOD,
  BADBUZZ_OFFSET,
  BADBUZZ_DRAIN,
  BADBUZZ_DURATION,
  BADBUZZ_ENERGY_COST,
  BADBUZZ_MIN_FOLLOWERS,
  trendActive,
} from "../src/engine/content/audience";

function celeb(followers = 0) {
  const s = createInitialState(0);
  s.job = "celebrite";
  s.flags.energyVisible = true;
  s.energy = 100; // énergie pleine (ENERGY_MAX) → energyFactor = 1
  s.followers = D(followers);
  s.maxFollowers = D(followers);
  return s;
}

describe("posts qui portent (célébrité)", () => {
  it("un post rapporte (500 + 0,2 % des followers) × facteurTendance × energyFactor", () => {
    const s = celeb(1_000_000);
    s.trendTimer = TREND_WINDOW + 1; // hors tendance
    const before = s.followers.toNumber();
    work(s);
    const expected = FOLLOWERS_PER_POST + POST_FOLLOWERS_SHARE * 1_000_000; // 500 + 2000
    expect(s.followers.toNumber() - before).toBeCloseTo(expected);
  });

  it("pendant une tendance, le post est ×8", () => {
    const s = celeb(1_000_000);
    s.trendTimer = 0; // fenêtre de tendance ouverte
    const before = s.followers.toNumber();
    work(s);
    const base = FOLLOWERS_PER_POST + POST_FOLLOWERS_SHARE * 1_000_000;
    expect(s.followers.toNumber() - before).toBeCloseTo(base * TREND_MULT);
  });

  it("le post met à jour le pic historique", () => {
    const s = celeb(1000);
    work(s);
    expect(s.maxFollowers.toNumber()).toBeCloseTo(s.followers.toNumber());
  });
});

describe("tendances déterministes", () => {
  it("la fenêtre est ouverte pendant les premières TREND_WINDOW secondes de chaque période", () => {
    const s = celeb(1000);
    s.trendTimer = 0;
    expect(trendActive(s)).toBe(true);
    s.trendTimer = TREND_WINDOW - 0.01;
    expect(trendActive(s)).toBe(true);
    s.trendTimer = TREND_WINDOW + 0.01;
    expect(trendActive(s)).toBe(false);
    s.trendTimer = TREND_PERIOD - 0.01;
    expect(trendActive(s)).toBe(false);
  });

  it("le cycle tourne dans le temps (déterministe, sans RNG)", () => {
    const s = celeb(1000);
    s.trendTimer = 0;
    tick(s, TREND_WINDOW + 1); // sort de la fenêtre
    expect(trendActive(s)).toBe(false);
    tick(s, TREND_PERIOD - (TREND_WINDOW + 1)); // boucle un cycle complet
    expect(trendActive(s)).toBe(true);
  });

  it("le cycle ne tourne pas hors célébrité", () => {
    const s = celeb(1000);
    s.job = "entrepreneur";
    s.trendTimer = 3;
    tick(s, 20);
    expect(s.trendTimer).toBe(3); // figé
  });
});

describe("bad buzz (célébrité)", () => {
  it("aucune polémique sous le seuil de followers", () => {
    const s = celeb(BADBUZZ_MIN_FOLLOWERS - 1);
    tick(s, BADBUZZ_OFFSET + 1);
    expect(s.badBuzz).toBeNull();
  });

  it("une polémique démarre à BADBUZZ_OFFSET dans le cycle, au-dessus du seuil", () => {
    const s = celeb(1_000_000);
    tick(s, BADBUZZ_OFFSET - 1);
    expect(s.badBuzz).toBeNull();
    tick(s, 2); // franchit l'offset
    expect(s.badBuzz).not.toBeNull();
    expect(s.badBuzz!.timeLeft).toBeGreaterThan(0);
  });

  it("la polémique draine ~1,5 %/s des followers courants (compound)", () => {
    const s = celeb(1_000_000);
    tick(s, BADBUZZ_OFFSET); // déclenche la polémique
    const start = s.followers.toNumber();
    tick(s, 10); // 10 s de drain
    const expected = start * Math.pow(1 - BADBUZZ_DRAIN, 10);
    expect(s.followers.toNumber()).toBeCloseTo(expected, 0);
  });

  it("la polémique s'éteint seule après BADBUZZ_DURATION", () => {
    const s = celeb(1_000_000);
    tick(s, BADBUZZ_OFFSET); // déclenche
    expect(s.badBuzz).not.toBeNull();
    tick(s, BADBUZZ_DURATION + 0.5);
    expect(s.badBuzz).toBeNull();
  });

  it("répondre coupe la polémique (8 énergie) et relance le timer", () => {
    const s = celeb(1_000_000);
    s.energy = 100;
    tick(s, BADBUZZ_OFFSET);
    expect(canAnswerBadBuzz(s)).toBe(true);
    expect(answerBadBuzz(s)).toBe(true);
    expect(s.badBuzz).toBeNull();
    expect(s.energy).toBeCloseTo(100 - BADBUZZ_ENERGY_COST);
    expect(s.badBuzzTimer).toBeGreaterThan(0);
  });

  it("répondre est refusé sans énergie ou sans polémique", () => {
    const s = celeb(1_000_000);
    expect(answerBadBuzz(s)).toBe(false); // pas de polémique
    tick(s, BADBUZZ_OFFSET); // déclenche la polémique
    s.energy = BADBUZZ_ENERGY_COST - 1; // énergie insuffisante (après la régénération du tick)
    expect(canAnswerBadBuzz(s)).toBe(false);
    expect(answerBadBuzz(s)).toBe(false);
  });

  it("le drain touche le stock, jamais le pic historique", () => {
    const s = celeb(1_000_000);
    const peak = s.maxFollowers.toNumber();
    tick(s, BADBUZZ_OFFSET);
    tick(s, BADBUZZ_DURATION); // drain complet
    expect(s.followers.toNumber()).toBeLessThan(peak);
    expect(s.maxFollowers.toNumber()).toBeCloseTo(peak); // pic intact
  });
});

describe("non-chevauchement tendance / bad buzz (obligatoire, ≥ 10 cycles)", () => {
  it("jamais une tendance active en même temps qu'une polémique, sur 12 cycles", () => {
    const s = celeb(5_000_000);
    let buzzTicks = 0;
    let overlaps = 0;
    const dt = 0.1;
    // 12 périodes de bad buzz (12 × 100 s = 1200 s)
    const steps = Math.round((12 * BADBUZZ_PERIOD) / dt);
    for (let i = 0; i < steps; i++) {
      tick(s, dt);
      if (s.badBuzz) {
        buzzTicks++;
        if (trendActive(s)) overlaps++;
      }
    }
    expect(buzzTicks).toBeGreaterThan(0); // des polémiques ont bien eu lieu
    expect(overlaps).toBe(0); // jamais de chevauchement
  });
});

describe("plafond AFK : gate politique sur le pic, pas le stock (obligatoire)", () => {
  it("un joueur passif voit son stock rongé par le bad buzz mais le pic tient la gate", () => {
    const s = celeb(49_500_000);
    // campagnes fortes : le stock franchit 50 M avant la première polémique
    s.generators["campagne"] = 40; // 80 000 followers/s
    let sawGap = false;
    const dt = 0.05;
    // simule 40 s (la polémique arrive à t = 15 et draine ~20 s)
    for (let i = 0; i < Math.round(40 / dt); i++) {
      tick(s, dt);
      if (s.followers.lt(s.maxFollowers)) sawGap = true;
    }
    // le pic a dépassé 50 M (via campagnes, avant la polémique) → gate ouverte
    expect(s.maxFollowers.gte(D(50_000_000))).toBe(true);
    expect(canPromote(s)).toBe(true);
    // le stock a été rongé sous le pic (la gate sur le stock aurait pu bloquer)
    expect(sawGap).toBe(true);
    expect(s.followers.lt(s.maxFollowers)).toBe(true);
  });
});

describe("gate célébrité → politique (pic historique ≥ 50 M)", () => {
  it("porte sur maxFollowers, pas sur le stock courant", () => {
    const s = createInitialState(0);
    s.job = "celebrite";
    s.followers = D(50_000_000); // stock courant seul ne suffit pas
    s.maxFollowers = D(10_000_000);
    expect(canPromote(s)).toBe(false);
    s.maxFollowers = D(50_000_000);
    expect(canPromote(s)).toBe(true);
    // le stock peut avoir chuté sous 50 M : le pic reste la référence
    s.followers = D(1_000_000);
    expect(canPromote(s)).toBe(true);
    promote(s);
    expect(s.job).toBe("politique");
  });
});
