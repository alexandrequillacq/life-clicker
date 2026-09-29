import { describe, it, expect } from "vitest";
import { createInitialState, createFreelanceState, type GameState } from "../src/engine/state";
import { serialize, deserialize } from "../src/engine/save";
import { KINDS, START_LPC, DUVAL, TEXTES } from "../src/engine/content/freelance";
import { tick } from "../src/engine/loop";
import { applyOffline } from "../src/engine/offline";
import { D } from "../src/engine/numbers";
import { tickFreelance, startFreelance, FL_REVEALS, isRevealed, revealQueue, acted, fmtEur, dayName, weekNumber } from "../src/engine/freelance";
import { currentTask, workClick, canWork, clickLines, aiWrite, addOrder, pendingLines, waitingValue } from "../src/engine/freelance";
import { CLICK_ENERGY, TIRED_BELOW, BUG_CLICKS } from "../src/engine/content/freelance";
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

describe("chapitre 2 : le carnet", () => {
  it("un clic écrit 5 lignes sur la commande de Mme Duval et coûte un peu d'énergie", () => {
    const s = fresh();
    s.energy = 100;
    expect(workClick(s)).toBe(true);
    expect(s.freelance.orders[0].done).toBe(START_LPC);
    expect(s.energy).toBeCloseTo(100 - CLICK_ENERGY);
    expect(s.totalClicks).toBe(1);
  });

  it("fatigué, un clic écrit moitié moins, mais le bouton ne se grise jamais", () => {
    const s = fresh();
    s.energy = TIRED_BELOW - 1;
    expect(clickLines(s)).toBe(START_LPC / 2);
    s.energy = 0;
    expect(canWork(s)).toBe(true);
    expect(workClick(s)).toBe(true);
  });

  it("un bug passe en tête du carnet et se corrige en 10 clics", () => {
    const s = fresh();
    s.energy = 100;
    s.freelance.bugs.push({ id: 99, site: null, order: null, clicks: 0, text: "x" });
    expect(currentTask(s)?.type).toBe("bug");
    for (let i = 0; i < BUG_CLICKS; i++) workClick(s);
    expect(s.freelance.bugs).toHaveLength(0);
    expect(s.freelance.orders[0].done).toBe(0); // les clics sont allés au bug
  });

  it("Mme Duval livrée, sa facture attend la micro-entreprise : pas encore d'argent", () => {
    const s = fresh();
    s.freelance.orders[0].done = KINDS.vitrine.lines - START_LPC;
    workClick(s);
    expect(s.freelance.orders).toHaveLength(0);
    expect(s.freelance.pendingInvoice).toBe(true);
    expect(s.freelance.delivered).toBe(1);
    expect(s.money.toNumber()).toBe(0);
  });

  it("une autre commande livrée paie son prix ; les clients se suivent dans l'ordre", () => {
    const s = fresh();
    s.freelance.orders = [];
    const o = addOrder(s, "vitrine");
    expect(o.client).toBe("Garage Leroy");
    expect(addOrder(s, "vitrine").client).toBe("Pharmacie Morel");
    o.done = o.lines - 1;
    workClick(s);
    expect(s.money.toNumber()).toBe(KINDS.vitrine.price);
    expect(s.freelance.ledger.livraisons).toBe(KINDS.vitrine.price);
  });

  it("l'IA écrit seule sur la première commande, jamais sur un bug, et ne fatigue pas", () => {
    const s = fresh();
    s.energy = 50;
    s.freelance.aiRate = 20;
    s.freelance.bugs.push({ id: 99, site: null, order: null, clicks: 0, text: "x" });
    aiWrite(s, 2);
    expect(s.freelance.orders[0].done).toBe(40);
    expect(s.freelance.bugs[0].clicks).toBe(0);
    expect(s.energy).toBe(50);
  });

  it("compte les lignes et l'argent qui attendent", () => {
    const s = fresh();
    addOrder(s, "appli");
    expect(pendingLines(s)).toBe(KINDS.vitrine.lines + KINDS.appli.lines);
    expect(waitingValue(s)).toBe(KINDS.vitrine.price + KINDS.appli.price);
  });
});
