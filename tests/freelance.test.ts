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
import { sanitizeCompanyName, createCompany, canCreateCompany, companyInitial } from "../src/engine/freelance";
import { COMPANY_DEFAULT_NAME, COMPANY_NAME_MAX, LOGO_COUNT } from "../src/engine/content/freelance";
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

describe("chapitre 2 : la micro-entreprise", () => {
  function delivered(): GameState {
    const s = fresh();
    s.freelance.orders[0].done = s.freelance.orders[0].lines - 1;
    workClick(s);
    return s;
  }

  it("nettoie le nom : bords, espaces doublés, caractères de contrôle, tirets longs, longueur", () => {
    expect(sanitizeCompanyName("  Pixel   & Co ")).toBe("Pixel & Co");
    expect(sanitizeCompanyName("A\u0007B")).toBe("AB");
    expect(sanitizeCompanyName("Web — Studio")).toBe("Web - Studio");
    expect(sanitizeCompanyName("x".repeat(40))).toHaveLength(COMPANY_NAME_MAX);
    expect(sanitizeCompanyName("   ")).toBe(COMPANY_DEFAULT_NAME);
  });

  it("ne se crée qu'une fois le site de Mme Duval prêt, et paie ses 600 €", () => {
    const s0 = fresh();
    expect(canCreateCompany(s0)).toBe(false);
    const s = delivered();
    expect(createCompany(s, "Pixel & Co", 2)).toBe(true);
    expect(s.freelance.company).toEqual({ name: "Pixel & Co", logo: 2 });
    expect(s.freelance.pendingInvoice).toBe(false);
    expect(s.money.toNumber()).toBe(600);
    expect(s.souvenirs[0].text).toBe("Première facture de Pixel & Co : 600 €, Mme Duval.");
    expect(s.freelance.quote).toBe("facture");
    expect(createCompany(s, "Autre", 0)).toBe(false);
  });

  it("borne le logo et garde le texte tel quel (jamais du HTML)", () => {
    const s = delivered();
    createCompany(s, "<img onerror=x>", 99);
    expect(s.freelance.company!.logo).toBe(LOGO_COUNT - 1);
    expect(s.freelance.company!.name).toBe("<img onerror=x>");
  });

  it("l'initiale du logo suit le nom, émojis compris", () => {
    expect(companyInitial("pixel")).toBe("P");
    expect(companyInitial("🍞 Pain")).toBe("🍞");
    expect(companyInitial("")).toBe("A");
  });
});

import { proposalVisible, acceptProposal, visibleProposals } from "../src/engine/freelance";
import { KEEP_UP_SECS, PROPOSAL_LATE, FL_WEEK_SECS, PETIT } from "../src/engine/content/freelance";

/** Mme Duval livrée et facturée. */
function invoiced(): GameState {
  const s = fresh();
  s.freelance.orders[0].done = s.freelance.orders[0].lines - 1;
  workClick(s);
  createCompany(s, "Pixel", 0);
  return s;
}

describe("chapitre 2 : la demande", () => {
  it("rien n'est proposé avant la facture ; ensuite, le contrat d'entretien dès que tu suis", () => {
    const s = fresh();
    run(s, 30);
    expect(visibleProposals(s)).toHaveLength(0);
    const t = invoiced();
    run(t, KEEP_UP_SECS + 1);
    expect(proposalVisible(t, "entretien_duval")).toBe(true);
    expect(proposalVisible(t, "cartes")).toBe(false); // une à la fois
    expect(acceptProposal(t, "entretien_duval")).toBe(true);
    expect(t.freelance.maintDuval).toBe(true);
    expect(proposalVisible(t, "entretien_duval")).toBe(false);
  });

  it("même si tu ne suis pas, la proposition suivante paraît au plus tard 120 s après la précédente", () => {
    const s = invoiced();
    run(s, KEEP_UP_SECS + 1);
    acceptProposal(s, "entretien_duval");
    s.freelance.orders.push({ id: 500, kind: "vitrine", client: "X", lines: 2000, done: 0, red: "none" }); // carnet jamais vide
    s.freelance.delivered = 0; // aucun outil ne se propose dans ce test : seule la proposition compte
    s.freelance.sites = []; // ni bug de Mme Duval
    s.freelance.home = 3; // ni logement (le deux-pièces est le dernier)
    // la nouveauté précédente (le contrat d'entretien) est parue à 0 s ; on en est à KEEP_UP_SECS + 1 s
    run(s, PROPOSAL_LATE - (KEEP_UP_SECS + 1) - 5);
    expect(proposalVisible(s, "cartes")).toBe(false);
    run(s, 10);
    expect(proposalVisible(s, "cartes")).toBe(true);
  });

  it("les cartes de visite font arriver un site vitrine chaque lundi", () => {
    const s = invoiced();
    run(s, KEEP_UP_SECS + 1);
    acceptProposal(s, "entretien_duval");
    run(s, 36 + KEEP_UP_SECS);
    expect(acceptProposal(s, "cartes")).toBe(true);
    const before = s.freelance.orders.length;
    run(s, FL_WEEK_SECS);
    expect(s.freelance.orders.length).toBe(before + 1);
    expect(s.freelance.orders.at(-1)!.kind).toBe("vitrine");
  });

  it("l'appli de M. Petit arrive tout de suite", () => {
    const s = invoiced();
    for (const id of ["entretien_duval", "cartes", "profil", "entretien_tous"]) s.freelance.proposals[id] = 0;
    s.freelance.lastNovelty = -1000;
    run(s, KEEP_UP_SECS + 1);
    expect(acceptProposal(s, "petit")).toBe(true);
    expect(s.freelance.orders.at(-1)).toMatchObject({ kind: "appli", client: PETIT.name });
  });
});

import { tickBugs, bugsLast7Days, maintenancePossible, maintenanceAtStake, eveningBugs, addSite } from "../src/engine/freelance";
import { DUVAL_FIRST_BUG, FORMATION_BUG_RATE } from "../src/engine/content/freelance";

describe("chapitre 2 : l'entretien", () => {
  it("le contrat de Mme Duval envoie son premier bug 40 s plus tard, puis un par semaine", () => {
    const s = invoiced();
    run(s, KEEP_UP_SECS + 1);
    acceptProposal(s, "entretien_duval");
    expect(s.freelance.sites).toHaveLength(1);
    run(s, DUVAL_FIRST_BUG + 0.1);
    expect(s.freelance.bugs).toHaveLength(1);
    expect(s.freelance.bugs[0].text).toBe("Les horaires du dimanche ont disparu.");
    expect(bugsLast7Days(s)).toBe(1);
  });

  it("un site n'a qu'un bug ouvert à la fois ; la formation espace les bugs", () => {
    const s = fresh();
    const site = addSite(s, DUVAL.name, "vitrine", 0);
    tickBugs(s);
    s.freelance.day += FL_WEEK_SECS;
    tickBugs(s);
    expect(s.freelance.bugs).toHaveLength(1);
    s.freelance.bugRate = FORMATION_BUG_RATE;
    s.freelance.bugs = [];
    site.bugOpen = false;
    site.nextBug = s.freelance.day;
    tickBugs(s);
    expect(site.nextBug - s.freelance.day).toBeCloseTo(FL_WEEK_SECS / FORMATION_BUG_RATE);
  });

  it("avec l'entretien à chaque livraison, chaque site livré devient un contrat", () => {
    const s = invoiced();
    s.freelance.maintAll = true;
    const o = addOrder(s, "boutique");
    o.done = o.lines - 1;
    workClick(s);
    expect(s.freelance.sites.map((x) => x.client)).toContain("Épicerie bio Garnier");
    expect(maintenancePossible(s)).toBe(130);
  });

  it("le vendredi soir, deux sites sans bug en reçoivent un ; l'argent en jeu suit les bugs ouverts", () => {
    const s = fresh();
    for (let i = 0; i < 3; i++) addSite(s, `Site ${i}`, "vitrine", 1e9);
    eveningBugs(s);
    expect(s.freelance.bugs).toHaveLength(2);
    expect(maintenanceAtStake(s)).toBe(100);
  });
});
