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

import { toolOffered, canBuyTool, buyTool, ownedTools } from "../src/engine/freelance";
import { TOOL_LATE, TOOLS } from "../src/engine/content/freelance";

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

  it("livrer l'appli de M. Petit change la réplique de la semaine", () => {
    const s = invoiced();
    const o = addOrder(s, "appli", PETIT.name);
    o.done = o.lines - 1;
    s.freelance.orders = [o];
    workClick(s);
    expect(s.freelance.quote).toBe("petit");
  });
});

import { mondayMorning, net, depositAll, withdrawAll, canDeposit } from "../src/engine/freelance";
import { NORA_SALARY, HOMES } from "../src/engine/content/freelance";

describe("chapitre 2 : le lundi", () => {
  it("paie l'entretien des sites sans bug, puis prélève abonnements, Nora et loyer, même en négatif", () => {
    const s = fresh();
    addSite(s, "A", "appli", 1e9);
    const b = addSite(s, "B", "vitrine", 1e9);
    b.bugOpen = true;
    s.freelance.subs = { autocompletion: 5, ia_pro: 50 };
    s.freelance.nora = true;
    s.freelance.home = 3;
    mondayMorning(s);
    const l = s.freelance.ledger;
    expect(l.entretien).toBe(160);
    expect(l.entretienPossible).toBe(210);
    expect(l.abonnements).toBe(55);
    expect(l.salaires).toBe(NORA_SALARY);
    expect(l.loyer).toBe(HOMES[3].rent);
    expect(s.money.toNumber()).toBe(160 - 55 - NORA_SALARY - HOMES[3].rent);
  });

  it("clôt la semaine : son net (hors achats) rejoint l'historique", () => {
    const s = fresh();
    s.freelance.ledger.livraisons = 600;
    s.freelance.ledger.repas = 22;
    s.freelance.ledger.achats = 250;
    mondayMorning(s);
    expect(s.freelance.history).toEqual([{ entrees: 600, net: 578, livraisons: 600, entretien: 0, charges: 22 }]);
    expect(s.freelance.lastWeek!.achats).toBe(250);
    expect(net(s.freelance.ledger)).toBe(0);
  });

  it("le livret verse 1 % de son plus petit solde de la semaine, compté dans les entrées", () => {
    const s = fresh();
    s.money = D(1000);
    expect(canDeposit(s)).toBe(true);
    depositAll(s);
    expect(s.freelance.livretBalance).toBe(1000);
    run(s, FL_WEEK_SECS + 0.1);
    expect(s.freelance.livretBalance).toBeCloseTo(1010);
    expect(s.freelance.ledger.livret).toBeCloseTo(10);
    withdrawAll(s);
    expect(s.money.toNumber()).toBeCloseTo(1010);
  });
});

describe("chapitre 2 : les outils", () => {
  it("la licence d'éditeur se propose au plus tard 60 s après la première livraison, même si tu suis", () => {
    const s = invoiced();
    run(s, TOOL_LATE - 5);
    expect(toolOffered(s)).toBeUndefined();
    run(s, 10);
    expect(toolOffered(s)?.id).toBe("editeur");
  });

  it("elle se propose plus tôt si tu ne suis plus depuis 6 s", () => {
    const s = invoiced();
    addOrder(s, "appli");
    s.freelance.orders[0].lines = 1e9;
    run(s, 7);
    // Le contrat d'entretien de Mme Duval a pris la place à 0 s : l'éditeur attend l'écart de 35 s entre nouveautés.
    expect(s.freelance.behind).toBeGreaterThanOrEqual(6);
    expect(toolOffered(s)).toBeUndefined();
    run(s, FL_NOVELTY_GAP - 6);
    expect(s.freelance.day).toBeLessThan(TOOL_LATE);
    expect(toolOffered(s)?.id).toBe("editeur");
  });

  it("acheter l'éditeur : 250 €, 8 lignes par clic ; puis l'écran attend une chambre", () => {
    const s = invoiced();
    run(s, TOOL_LATE + 1);
    s.money = D(100);
    expect(canBuyTool(s, "editeur")).toBe(false); // il faut 250 € en poche
    s.money = D(250);
    expect(buyTool(s, "editeur")).toBe(true);
    expect(s.freelance.lpc).toBe(8);
    expect(s.freelance.ledger.achats).toBe(250);
    run(s, TOOL_LATE + 40);
    expect(toolOffered(s)).toBeUndefined(); // pas de deuxième écran sur le canapé de Sam
    s.freelance.home = 1;
    run(s, 36);
    expect(toolOffered(s)?.id).toBe("ecran");
  });

  it("un abonnement se paie d'avance, puis chaque lundi ; l'abonnement pro remplace celui des pages neuves", () => {
    const s = invoiced();
    s.money = D(10000);
    for (const t of TOOLS.slice(0, 3)) s.freelance.tools[t.id] = 0; // éditeur, écran, autocomplétion
    s.freelance.subs = { autocompletion: 5 };
    s.freelance.revealed["tool_ia_pages"] = 0;
    expect(buyTool(s, "ia_pages")).toBe(true);
    expect(s.freelance.aiRate).toBe(20);
    expect(s.freelance.ledger.abonnements).toBe(25);
    expect(s.freelance.subs).toEqual({ autocompletion: 5, ia_pages: 25 });
    s.freelance.tools.theme = 0;
    s.freelance.tools.formation = 0;
    s.freelance.revealed["tool_ia_pro"] = 0;
    buyTool(s, "ia_pro");
    expect(s.freelance.subs).toEqual({ autocompletion: 5, ia_pro: 50 });
    expect(ownedTools(s).map((t) => t.id)).not.toContain("ia_pages");
  });

  it("la formation attend 3 bugs en 7 jours, puis divise les bugs par deux et active les tests", () => {
    const s = invoiced();
    s.money = D(10000);
    for (const t of TOOLS.slice(0, 5)) s.freelance.tools[t.id] = 0;
    s.freelance.lastNovelty = -1000;
    run(s, TOOL_LATE + 1);
    expect(toolOffered(s)).toBeUndefined();
    s.freelance.bugArrivals = [s.freelance.day, s.freelance.day, s.freelance.day];
    run(s, 0.1);
    expect(toolOffered(s)?.id).toBe("formation");
    buyTool(s, "formation");
    expect(s.freelance.bugRate).toBe(0.5);
    expect(s.freelance.tests).toBe(true);
  });
});

import { homeOffered, moveHome, energyMax } from "../src/engine/freelance";
import { HOME_RENT_FACTOR } from "../src/engine/content/freelance";

describe("chapitre 2 : le logement", () => {
  it("la chambre se propose quand une semaine rapporte 5 fois son loyer", () => {
    const s = fresh();
    s.freelance.history = [{ entrees: HOME_RENT_FACTOR * HOMES[1].rent - 1, net: 0, livraisons: 0, entretien: 0, charges: 0 }];
    run(s, 1);
    expect(homeOffered(s)).toBeUndefined();
    s.freelance.history.push({ entrees: HOME_RENT_FACTOR * HOMES[1].rent + 10, net: 0, livraisons: 0, entretien: 0, charges: 0 });
    run(s, 1);
    expect(homeOffered(s)?.id).toBe("chambre");
  });

  it("déménager agrandit l'énergie maximale, laisse un souvenir, et le loyer tombe le lundi", () => {
    const s = fresh();
    s.freelance.revealed["home_chambre"] = 0;
    s.energy = 90;
    expect(moveHome(s)).toBe(true);
    expect(energyMax(s)).toBe(120);
    expect(s.energy).toBe(110);
    expect(s.souvenirs[0].text).toBe(HOMES[1].souvenir);
    mondayMorning(s);
    expect(s.freelance.ledger.loyer).toBe(110);
  });
});

import {
  tickEnergy, eat, canEat, deliveryOffered, acceptDelivery, restPerMin, goToDinner, canGoToDinner,
  answerMaman, canAnswerMaman, mamanIAOffered, acceptMamanIA, goOut, canGoOut, canWork as canWorkNow,
} from "../src/engine/freelance";
import { MEALS_BEFORE_DELIVERY, MEAL_PRICE, FRIENDS_MAX_MISSES, DINNER_ENERGY, SUNDAY, FRIDAY } from "../src/engine/content/freelance";
import { computeInitialSens } from "../src/engine/content/audience";

/** Avance jusqu'au début du jour `wd` (0 = lundi) de la semaine `week` (1 = la première). */
function goTo(s: GameState, week: number, wd: number): void {
  run(s, ((week - 1) * 7 + wd) * FL_DAY_SECS + 0.05 - s.freelance.day, 0.25);
}

describe("chapitre 2 : la vie", () => {
  it("l'énergie remonte jusqu'au maximum du logement, pas au-delà", () => {
    const s = fresh();
    s.energy = 99.9;
    tickEnergy(s, 10);
    expect(s.energy).toBe(100);
  });

  it("deux repas par jour ; après 30 repas, les repas livrés se proposent", () => {
    const s = fresh();
    s.energy = 50;
    expect(eat(s)).toBe(true);
    expect(eat(s)).toBe(true);
    expect(canEat(s)).toBe(false);
    s.freelance.mealsCooked = MEALS_BEFORE_DELIVERY;
    run(s, 1);
    expect(deliveryOffered(s)).toBe(true);
  });

  it("un repas livré par jour : 11 €, l'énergie monte seule ; le repos se lit en énergie par minute", () => {
    const s = fresh();
    s.freelance.revealed["livraison"] = 0;
    acceptDelivery(s);
    s.energy = 10;
    run(s, FL_DAY_SECS);
    expect(s.freelance.ledger.repas).toBe(MEAL_PRICE);
    expect(s.money.toNumber()).toBe(-MEAL_PRICE);
    expect(restPerMin(s)).toBe(58); // 0,3 × 60 + 10 × 4 jours par minute
    s.freelance.home = 2;
    expect(restPerMin(s)).toBe(78);
  });

  it("le dîner du vendredi occupe les mains jusqu'à samedi et recharge", () => {
    const s = fresh();
    goTo(s, 2, FRIDAY);
    expect(canGoToDinner(s)).toBe(true);
    s.energy = 30;
    goToDinner(s);
    expect(s.energy).toBe(30 + DINNER_ENERGY);
    expect(canWorkNow(s)).toBe(false);
    goTo(s, 2, FRIDAY + 1);
    expect(canWorkNow(s)).toBe(true);
    expect(s.souvenirs[0].text).toBe("Tu as dîné avec Sam, Inès et Léo.");
  });

  it("trois dîners manqués d'affilée : les amis n'invitent plus, et le Sens le sent", () => {
    const s = fresh();
    const sensBefore = computeInitialSens(s);
    goTo(s, 2 + FRIENDS_MAX_MISSES, 0);
    expect(s.freelance.friends).toBe(false);
    expect(s.freelance.liensPerdus).toBe(1);
    expect(s.souvenirs.map((m) => m.text)).toContain("Sam, Inès et Léo ne t'invitent plus le vendredi.");
    expect(s.souvenirs.find((m) => m.text === "Tes amis ont dîné sans toi.")!.day).toBe("Vendredi");
    expect(computeInitialSens(s)).toBeLessThan(sensBefore);
  });

  it("Maman appelle le dimanche : décrocher remplit l'énergie et bloque jusqu'à lundi ; sinon, un message vocal", () => {
    const s = fresh();
    goTo(s, 1, SUNDAY);
    expect(canAnswerMaman(s)).toBe(true);
    s.energy = 20;
    answerMaman(s);
    expect(s.energy).toBe(100);
    expect(canWorkNow(s)).toBe(false);
    goTo(s, 2, SUNDAY);
    goTo(s, 3, 0);
    const vocal = s.souvenirs.find((m) => m.text === "Maman a laissé un message vocal.")!;
    expect(vocal.missed).toBe(true);
    expect(vocal.day).toBe("Dimanche");
  });

  it("avec l'IA de ta boîte mail, l'IA peut répondre à Maman : un lien délégué", () => {
    const s = fresh();
    s.freelance.subs.ia_mail = 10;
    goTo(s, 1, SUNDAY);
    run(s, 1);
    expect(mamanIAOffered(s)).toBe(true);
    acceptMamanIA(s);
    expect(s.vieAutomatiseeCount).toBe(1);
    goTo(s, 2, SUNDAY);
    expect(canAnswerMaman(s)).toBe(false);
    expect(s.souvenirs[0].text).toBe("Le répondeur IA a répondu à Maman.");
  });

  it("un mercredi sur deux, une sortie payée", () => {
    const s = fresh();
    goTo(s, 1, 2);
    expect(canGoOut(s)).toBe(false);
    goTo(s, 2, 2);
    expect(canGoOut(s)).toBe(true);
    goOut(s);
    expect(s.freelance.ledger.sorties).toBe(12);
    expect(s.freelance.outings).toBe(1);
  });
});

import { compromisVisible, takeCompromis } from "../src/engine/freelance";
import { RED_EVERY, COMPROMIS_LINES } from "../src/engine/content/freelance";

describe("chapitre 2 : le compromis", () => {
  function withTests(): GameState {
    const s = invoiced();
    s.freelance.tests = true;
    return s;
  }
  function finishFirst(s: GameState): void {
    s.freelance.orders[0].done = s.freelance.orders[0].lines - 1;
    workClick(s);
  }

  it("une livraison sur trois bute sur un test rouge, qui passe juste après la tâche en cours", () => {
    const s = withTests();
    addOrder(s, "vitrine");
    addOrder(s, "vitrine");
    finishFirst(s);
    finishFirst(s);
    expect(s.freelance.reds).toBe(RED_EVERY - 1);
    addOrder(s, "vitrine");
    s.freelance.bugs.push({ id: 900, site: null, order: null, clicks: 0, text: "en cours" }, { id: 901, site: null, order: null, clicks: 0, text: "suivant" });
    s.freelance.orders[0].done = s.freelance.orders[0].lines;
    s.freelance.aiRate = 1;
    aiWrite(s, 0.001);
    expect(s.freelance.orders[0].red).toBe("failing");
    expect(s.freelance.bugs.map((b) => b.text)).toEqual(["en cours", "Un test échoue.", "suivant"]);
    expect(compromisVisible(s)).toBe(true);
  });

  it("désactiver le test : la commande part, plus de test rouge, 20 % de lignes en moins ensuite, et Mme Duval perd des commandes", () => {
    const s = withTests();
    s.freelance.reds = RED_EVERY - 1;
    addOrder(s, "vitrine");
    finishFirst(s);
    expect(s.freelance.orders[0].red).toBe("failing");
    const money = s.money.toNumber();
    expect(takeCompromis(s)).toBe(true);
    expect(s.freelance.orders).toHaveLength(0);
    expect(s.money.toNumber()).toBe(money + 600);
    expect(s.freelance.bugs).toHaveLength(0);
    expect(addOrder(s, "appli").lines).toBe(Math.round(4000 * COMPROMIS_LINES));
    expect(compromisVisible(s)).toBe(false);
    run(s, FL_WEEK_SECS + 0.05); // +0.05 s : franchir la frontière du lundi malgré la dérive flottante
    expect(s.freelance.quote).toBe("gateaux");
  });

  it("refusé, le test rouge se corrige en 10 clics et la commande part", () => {
    const s = withTests();
    s.freelance.reds = RED_EVERY - 1;
    addOrder(s, "vitrine");
    finishFirst(s);
    s.energy = 100;
    for (let i = 0; i < BUG_CLICKS; i++) workClick(s);
    expect(s.freelance.orders).toHaveLength(0);
    expect(compromisVisible(s)).toBe(true);
  });
});
