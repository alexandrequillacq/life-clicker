import { describe, it, expect } from "vitest";
import { createInitialState, createFreelanceState, type GameState } from "../src/engine/state";
import { serialize, deserialize } from "../src/engine/save";
import { KINDS, START_LPC, DUVAL, TEXTES } from "../src/engine/content/freelance";
import { tick } from "../src/engine/loop";
import { applyOffline } from "../src/engine/offline";
import { D } from "../src/engine/numbers";
import { tickFreelance, startFreelance, FL_REVEALS, isRevealed, revealQueue, acted, fmtEur, dayName, weekNumber } from "../src/engine/freelance";
import { FL_NOVELTY_GAP, FL_DAY_SECS, FL_OFFLINE_CAP } from "../src/engine/content/freelance";

/** Un état neuf au premier lundi du chapitre 2. */
function fresh(): GameState {
  const s = createInitialState(0);
  startFreelance(s);
  return s;
}
/** Fait passer `secs` secondes de calendrier par pas de `dt`. */
function run(s: GameState, secs: number, dt = 0.05): void {
  for (let t = 0; t < secs - 1e-9; t += dt) tickFreelance(s, Math.min(dt, secs - t));
}

describe("chapitre 2 : l'état", () => {
  it("commence avec la commande de Mme Duval, 5 lignes par clic, sur le canapé de Sam", () => {
    const f = createFreelanceState();
    expect(f.orders).toHaveLength(1);
    expect(f.orders[0]).toMatchObject({ kind: "vitrine", client: DUVAL.name, lines: KINDS.vitrine.lines, done: 0, red: "none" });
    expect(f.lpc).toBe(START_LPC);
    expect(f.home).toBe(0);
    expect(f.company).toBeNull();
    expect(f.quote).toBe("debut");
  });

  it("survit à une sauvegarde, et une vieille sauvegarde reçoit un chapitre 2 neuf", () => {
    const s = createInitialState(0);
    s.freelance.lpc = 12;
    expect(deserialize(serialize(s)).freelance.lpc).toBe(12);
    const raw = JSON.parse(serialize(s));
    delete raw.freelance;
    expect(deserialize(JSON.stringify(raw)).freelance.orders).toHaveLength(1);
  });

  it("aucun texte du chapitre ne sépare par un tiret long ou court", () => {
    const all = JSON.stringify(TEXTES) + JSON.stringify(KINDS);
    expect(all).not.toMatch(/[—–]/);
  });
});

describe("chapitre 2 : branché", () => {
  it("formate les euros à l'entier, avec des espaces et un vrai signe moins", () => {
    expect(fmtEur(1190)).toBe("1 190 €");
    expect(fmtEur(-2000)).toBe("−2 000 €");
    expect(fmtEur(49.6)).toBe("50 €");
  });

  it("le calendrier commence un lundi de la semaine 1", () => {
    const s = fresh();
    expect(dayName(s)).toBe("Lundi");
    expect(weekNumber(s)).toBe(1);
    run(s, FL_DAY_SECS * 7 + 1);
    expect(dayName(s)).toBe("Lundi");
    expect(weekNumber(s)).toBe(2);
  });

  it("au chapitre 2, l'argent peut passer sous zéro et l'énergie ne remonte pas de 3 / s", () => {
    const s = fresh();
    s.money = D(-100);
    s.energy = 50;
    tick(s, 1);
    expect(s.money.toNumber()).toBe(-100);
    expect(s.energy).toBeLessThan(52);
    expect(s.freelance.day).toBeCloseTo(1);
  });

  it("le hors-ligne est plafonné à 10 minutes de calendrier", () => {
    const s = fresh();
    s.lastSeen = Date.now() - 2 * 3600 * 1000;
    applyOffline(s, Date.now());
    expect(s.freelance.day).toBeLessThanOrEqual(FL_OFFLINE_CAP + 1e-6);
    expect(s.freelance.day).toBeGreaterThan(FL_OFFLINE_CAP - 1);
  });
});

describe("chapitre 2 : la file des nouveautés", () => {
  it("un jeu attend 35 s après la nouveauté précédente ; un geste passe aussitôt et repousse la suite", () => {
    const s = fresh();
    let a = false;
    let b = false;
    let g = false;
    FL_REVEALS.push({ id: "t_a", kind: "jeu", ready: () => a }, { id: "t_b", kind: "jeu", ready: () => b }, { id: "t_g", kind: "geste", ready: () => g });
    try {
      a = true;
      b = true;
      revealQueue(s);
      expect(isRevealed(s, "t_a")).toBe(true);
      expect(isRevealed(s, "t_b")).toBe(false);
      run(s, FL_NOVELTY_GAP - 1);
      expect(isRevealed(s, "t_b")).toBe(false);
      g = true;
      acted(s);
      expect(isRevealed(s, "t_g")).toBe(true);
      run(s, FL_NOVELTY_GAP - 1);
      expect(isRevealed(s, "t_b")).toBe(false); // le geste a repoussé la suite
      run(s, 2);
      expect(isRevealed(s, "t_b")).toBe(true);
    } finally {
      FL_REVEALS.splice(FL_REVEALS.findIndex((r) => r.id === "t_a"), 3);
    }
  });
});
