import type { GameState, FlBug, FlOrder, FlSite, FlLedger } from "../state";
import {
  KINDS,
  QUOTES,
  TEXTES,
  DUVAL,
  TOOL_BY_ID,
  NORA_SALARY,
  AGE_FREELANCE,
  COMPANY_DEFAULT_NAME,
  COMPANY_NAME_MAX,
  LOGO_COUNT,
  MEAL_PRICE,
  DINNER_ENERGY,
  OUTING_ENERGY,
  BUG_CLICKS,
} from "../content/freelance";
import { fmtEur, dayName, weekNumber, handsFree } from "./commun";
import { isRevealed } from "./revelations";
import {
  currentTask,
  clickLines,
  canWork,
  workClick,
  isTired,
  clientOf,
  maintenancePossible,
  bugsLast7Days,
  waitingValue,
} from "./carnet";
import { canCreateCompany, createCompany, companyInitial, companyName } from "./entreprise";
import { visibleProposals, acceptProposal } from "./demande";
import { toolOffered, canBuyTool, buyTool, ownedTools } from "./outils";
import { currentHome, energyMax, homeOffered, moveHome } from "./logement";
import {
  restPerMin,
  canEat,
  eat,
  deliveryOffered,
  acceptDelivery,
  canGoToDinner,
  goToDinner,
  canAnswerMaman,
  answerMaman,
  mamanIAOffered,
  acceptMamanIA,
  currentOuting,
  canGoOut,
  goOut,
} from "./vie";
import { compromisVisible, takeCompromis } from "./compromis";
import { noraOffered, hireNora } from "./sortie";
import { subsTotal, entrees, chargesPro, chargesPerso, net, canDeposit, depositAll, canWithdraw, withdrawAll } from "./finances";

// Ce que l'écran du chapitre 2 affiche, bloc par bloc. Chaque fonction rend null quand son bloc est caché.
// Freelance.svelte ne fait que mettre ces blocs en page, selon les paliers et l'onglet.

export interface Bouton {
  label: string;
  price?: string;
  lines: string[];
  disabled: boolean;
  act: () => void;
}
const bouton = (label: string, lines: string[], act: () => void, disabled = false, price?: string): Bouton => ({ label, lines, act, disabled, price });

// --- Les paliers, le menu, la marque ---

export interface VuePaliers {
  couleur: boolean;
  etiquettes: boolean;
  ombre: boolean;
  verre: boolean;
  menu: boolean;
}
export function vuePaliers(s: GameState): VuePaliers {
  return {
    couleur: isRevealed(s, "couleur"),
    etiquettes: isRevealed(s, "etiquettes"),
    ombre: isRevealed(s, "ombre"),
    verre: isRevealed(s, "verre"),
    menu: isRevealed(s, "menu"),
  };
}
export const vueMenu = (s: GameState): string[] | null => (isRevealed(s, "menu") ? TEXTES.tabs : null);
export function vueMarque(s: GameState): { name: string; logo: number; initial: string } | null {
  const c = s.freelance.company;
  return c ? { name: c.name, logo: c.logo, initial: companyInitial(c.name) } : null;
}

// --- L'en-tête ---

export interface VueEntete {
  quote: string;
  money: string;
  monday: string | null;
  when: string;
}
export function vueEntete(s: GameState): VueEntete {
  const f = s.freelance;
  const week = isRevealed(s, "semaine");
  const parts: string[] = [];
  if (week) {
    const possible = maintenancePossible(s);
    if (possible > 0) parts.push(TEXTES.mondayEntretien(fmtEur(possible)));
    const rent = currentHome(s).rent;
    if (rent > 0) parts.push(TEXTES.mondayRent(fmtEur(rent)));
    const subs = subsTotal(s);
    if (subs > 0) parts.push(TEXTES.mondaySubs(fmtEur(subs), Object.keys(f.subs).length));
    if (f.nora) parts.push(TEXTES.mondayNora(fmtEur(NORA_SALARY)));
  }
  return {
    quote: QUOTES[f.quote],
    money: fmtEur(s.money.toNumber()),
    monday: parts.length > 0 ? TEXTES.mondayLine(parts) : null,
    when: week ? TEXTES.dayWeek(dayName(s), weekNumber(s)) : dayName(s),
  };
}

// --- Le carnet ---

export interface VueTache {
  kind: "bug" | "red" | "order" | "empty";
  title: string;
  lines: string[];
  share: number | null;
  progress: string | null;
}
export interface VueLigne {
  tag: string;
  tagKind: "bug" | "red" | "order";
  client: string;
  detail: string;
  money: string;
  loss: boolean;
  dim: boolean;
}
export interface VueFacture {
  title: string;
  lines: string[];
  field: string;
  defaultName: string;
  maxLength: number;
  logos: string;
  logoCount: number;
  cta: string;
  create: (name: string, logo: number) => void;
}
export interface VueCarnet {
  title: string;
  count: string | null;
  invoice: VueFacture | null;
  task: VueTache;
  work: Bouton;
  next: VueLigne[] | null;
  more: string | null;
}

const orderOf = (s: GameState, id: number | null): FlOrder | undefined => s.freelance.orders.find((o) => o.id === id);
const siteOf = (s: GameState, id: number | null): FlSite | undefined => s.freelance.sites.find((x) => x.id === id);

function tacheBug(s: GameState, b: FlBug): VueTache {
  const progress = { share: b.clicks / BUG_CLICKS, progress: TEXTES.clicks(Math.floor(b.clicks)) };
  if (b.order !== null) {
    const o = orderOf(s, b.order);
    const c = clientOf(o?.client ?? "");
    return { kind: "red", title: TEXTES.redTitle(c.chez), lines: [TEXTES.redWhy(fmtEur(o ? KINDS[o.kind].price : 0))], ...progress };
  }
  const c = clientOf(siteOf(s, b.site)?.client ?? "");
  return { kind: "bug", title: TEXTES.bugTitle(c.chez), lines: [b.text, TEXTES.bugWhy(c.payer)], ...progress };
}
function tacheCommande(s: GameState, o: FlOrder): VueTache {
  const lines = [TEXTES.orderPrice(fmtEur(KINDS[o.kind].price))];
  if (s.freelance.aiRate > 0) lines.push(TEXTES.aiWithYou);
  return {
    kind: "order",
    title: TEXTES.orderTitle(KINDS[o.kind].label, clientOf(o.client).chez),
    lines,
    share: o.done / o.lines,
    progress: TEXTES.orderProgress(Math.floor(o.done), o.lines),
  };
}
function ligneBug(s: GameState, b: FlBug): VueLigne {
  if (b.order !== null) {
    const o = orderOf(s, b.order);
    return { tag: TEXTES.tagRed, tagKind: "red", client: clientOf(o?.client ?? "").name, detail: TEXTES.redText, money: TEXTES.blocked(fmtEur(o ? KINDS[o.kind].price : 0)), loss: true, dim: false };
  }
  const site = siteOf(s, b.site);
  return { tag: TEXTES.tagBug, tagKind: "bug", client: site?.client ?? "", detail: b.text, money: TEXTES.lossMonday(fmtEur(site?.fee ?? 0)), loss: true, dim: false };
}
function ligneCommande(o: FlOrder): VueLigne {
  const k = KINDS[o.kind];
  const detail = o.done > 0 ? TEXTES.orderDetail(k.label, Math.floor(o.done), o.lines) : TEXTES.orderWaiting(k.label);
  return { tag: TEXTES.tagOrder, tagKind: "order", client: o.client, detail, money: TEXTES.plusMoney(fmtEur(k.price)), loss: false, dim: o.done === 0 };
}
function boutonTravail(s: GameState): Bouton {
  const f = s.freelance;
  const task = currentTask(s);
  let label: string = TEXTES.nothing;
  if (!handsFree(s)) label = TEXTES.busy[f.busyWhy] ?? TEXTES.nothing;
  else if (task?.type === "bug") label = task.bug.order !== null ? TEXTES.fixRed : TEXTES.fixBug;
  else if (task) label = TEXTES.writeCode(clickLines(s)).replace(/(\d+)\.(\d)/, "$1,$2"); // « 2,5 lignes » quand tu es fatigué
  const lines = task && isTired(s) ? [TEXTES.tired] : [];
  return bouton(label, lines, () => workClick(s), !canWork(s));
}

export function vueCarnet(s: GameState): VueCarnet {
  const f = s.freelance;
  const task = currentTask(s);
  const t: VueTache = !task
    ? { kind: "empty", title: TEXTES.nothing, lines: [], share: null, progress: null }
    : task.type === "bug"
      ? tacheBug(s, task.bug)
      : tacheCommande(s, task.order);
  let next: VueLigne[] | null = null;
  let more: string | null = null;
  if (isRevealed(s, "ensuite")) {
    const rows: VueLigne[] = [];
    for (const b of f.bugs) if (task?.type !== "bug" || b.id !== task.bug.id) rows.push(ligneBug(s, b));
    for (const o of f.orders) if (task?.type !== "order" || o.id !== task.order.id) rows.push(ligneCommande(o));
    if (rows.length > 0) next = rows.slice(0, 3);
    if (rows.length > 3) more = TEXTES.more(rows.length - 3);
  }
  const invoice: VueFacture | null = canCreateCompany(s)
    ? {
        title: TEXTES.invoiceTitle,
        lines: TEXTES.invoiceLines,
        field: TEXTES.invoiceField,
        defaultName: COMPANY_DEFAULT_NAME,
        maxLength: COMPANY_NAME_MAX,
        logos: TEXTES.invoiceLogos,
        logoCount: LOGO_COUNT,
        cta: TEXTES.invoiceCta(fmtEur(KINDS.vitrine.price)),
        create: (name, logo) => {
          createCompany(s, name, logo);
        },
      }
    : null;
  return {
    title: TEXTES.carnetTitle,
    count: isRevealed(s, "menu") ? TEXTES.count(f.orders.length, f.bugs.length) : null,
    invoice,
    task: t,
    work: boutonTravail(s),
    next,
    more,
  };
}

// --- Les améliorations, les clients, ce qui travaille sans toi ---

export function vueAmeliorations(s: GameState): { title: string; offer: Bouton | null; owned: string[] } | null {
  const offered = toolOffered(s);
  const sansToi = isRevealed(s, "sans_toi");
  const owned = ownedTools(s)
    .filter((t) => !(sansToi && (t.aiRate || t.id === "ia_mail" || t.formation)))
    .map((t) => `${t.name} : ${t.owned}`);
  if (!offered && owned.length === 0) return null;
  const offer = offered
    ? bouton(offered.cta, offered.lines, () => buyTool(s, offered.id), !canBuyTool(s, offered.id), offered.cost > 0 ? fmtEur(offered.cost) : TEXTES.eachMonday(fmtEur(offered.sub)))
    : null;
  return { title: TEXTES.upgradesTitle, offer, owned };
}

export interface VueClient {
  id: number;
  initials: string;
  name: string;
  detail: string;
  fee: string;
  late: boolean;
}
function vueClient(site: FlSite): VueClient {
  const initials = site.client
    .split(/\s+/)
    .filter((w) => /^\p{Lu}/u.test(w))
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  const detail = site.client === DUVAL.name ? TEXTES.firstClient : `${KINDS[site.kind].label.toLowerCase()}, ${TEXTES.since(site.sinceWeek)}`;
  return {
    id: site.id,
    initials,
    name: site.client,
    detail,
    fee: site.bugOpen ? TEXTES.feeAtStake(fmtEur(site.fee)) : TEXTES.feeMonday(fmtEur(site.fee)),
    late: site.bugOpen,
  };
}
export function vueClients(s: GameState): { title: string; offers: Bouton[]; list: VueClient[] | null } | null {
  const offers = visibleProposals(s).map((p) => bouton(p.cta, p.lines, () => acceptProposal(s, p.id), false, TEXTES.free));
  const list = isRevealed(s, "clients") && s.freelance.sites.length > 0 ? s.freelance.sites.map(vueClient) : null;
  if (offers.length === 0 && !list) return null;
  return { title: TEXTES.clientsTitle, offers, list };
}
export function vueTopClients(s: GameState): { title: string; items: VueClient[] } | null {
  if (!isRevealed(s, "top_clients")) return null;
  const items = [...s.freelance.sites].sort((a, b) => b.fee - a.fee || a.sinceWeek - b.sinceWeek).slice(0, 4).map(vueClient);
  return { title: TEXTES.topClientsTitle, items };
}

export interface VueOutil {
  name: string;
  state: string;
  hint: string | null;
  cost: string | null;
  compromis: Bouton | null;
}
export function vueSansToi(s: GameState): { title: string; items: VueOutil[] } | null {
  if (!isRevealed(s, "sans_toi")) return null;
  const f = s.freelance;
  const items: VueOutil[] = [];
  if (f.aiRate > 0) {
    const sub = f.subs.ia_pro ?? f.subs.ia_pages ?? 0;
    items.push({ name: TOOL_BY_ID.ia_pages.name, state: TEXTES.aiState(f.aiRate), hint: TEXTES.aiHint, cost: TEXTES.eachMonday(fmtEur(sub)), compromis: null });
  }
  if (f.subs.ia_mail !== undefined) {
    items.push({ name: TOOL_BY_ID.ia_mail.name, state: TEXTES.mailState, hint: TEXTES.mailHint, cost: TEXTES.eachMonday(fmtEur(f.subs.ia_mail)), compromis: null });
  }
  if (f.tests) {
    items.push({
      name: TOOL_BY_ID.formation.name,
      state: TEXTES.testsState,
      hint: f.compromis === "taken" ? null : TEXTES.testsHint,
      cost: null,
      compromis: compromisVisible(s) ? bouton(TEXTES.compromisCta, TEXTES.compromisLines, () => takeCompromis(s), false, TEXTES.free) : null,
    });
  }
  if (f.nora) items.push({ name: TEXTES.noraName, state: TEXTES.noraHired, hint: null, cost: TEXTES.eachMonday(fmtEur(NORA_SALARY)), compromis: null });
  return { title: TEXTES.sansToiTitle, items };
}

// --- Ta vie ---

export interface VueVie {
  title: string;
  age: string;
  energy: string;
  share: number;
  rest: string | null;
  logement: string | null; // en texte, jusqu'au deux-pièces
  home: { id: string; caption: string; line: string } | null; // en image, au deux-pièces
  homeOffer: Bouton | null;
  meal: Bouton | null;
  delivery: Bouton | null;
  ratios: [string, string][] | null;
}
export function vueVie(s: GameState): VueVie {
  const f = s.freelance;
  const h = currentHome(s);
  const max = energyMax(s);
  const verre = isRevealed(s, "verre");
  const next = homeOffered(s);
  const ratios: [string, string][] = [];
  if (isRevealed(s, "ratios")) {
    ratios.push([TEXTES.ratioMaman, TEXTES.ratioOf(f.mamanCalls, f.mamanRings)]);
    if (f.friends) ratios.push([TEXTES.ratioDinners, TEXTES.ratioOf(f.dinners, f.dinnerInvites)]);
    if (f.outings > 0) ratios.push([TEXTES.ratioOutings, TEXTES.times(f.outings)]);
    if (f.delivery) ratios.push([TEXTES.ratioMeals, TEXTES.mealPrice(fmtEur(MEAL_PRICE))]);
  }
  const mealLines =
    f.mealsToday >= 2 ? [TEXTES.mealDone] : TEXTES.mealLines(Math.round(s.energy), Math.min(max, Math.round(s.energy + h.meal)));
  return {
    title: TEXTES.colLife,
    age: TEXTES.ageWhen(AGE_FREELANCE, vueEntete(s).when),
    energy: TEXTES.energy(Math.round(s.energy), max),
    share: s.energy / max,
    rest: isRevealed(s, "repos") ? TEXTES.rest(restPerMin(s)) : null,
    logement: verre ? null : TEXTES.logement(h.label),
    home: verre ? { id: h.id, caption: TEXTES.homeCaption(h.label), line: TEXTES.homeSince(fmtEur(h.rent), max) } : null,
    homeOffer: next ? bouton(next.cta, TEXTES.homeLines(fmtEur(next.rent), max, next.energyMax), () => moveHome(s)) : null,
    meal: isRevealed(s, "repas") ? bouton(TEXTES.mealCta, mealLines, () => eat(s), !canEat(s)) : null,
    delivery: deliveryOffered(s) ? bouton(TEXTES.deliveryCta, TEXTES.deliveryLines(fmtEur(MEAL_PRICE), h.meal), () => acceptDelivery(s)) : null,
    ratios: ratios.length > 0 ? ratios : null,
  };
}

export interface VueRdv {
  title: string;
  when: string | null;
  buttons: Bouton[];
}
/** Les rendez-vous datés : dans « Ta vie », puis dans la carte sombre « D'ici lundi » (après le travail du soir). */
export function vueRendezVous(s: GameState): { title: string | null; items: VueRdv[] } | null {
  const f = s.freelance;
  const items: VueRdv[] = [];
  if (f.dinnerOpen) {
    const lines = [...TEXTES.dinnerLines(DINNER_ENERGY), ...(f.evening ? [TEXTES.dinnerEvening] : [])];
    items.push({ title: TEXTES.dinnerTitle, when: TEXTES.dIciFriday, buttons: [bouton(TEXTES.dinnerCta, lines, () => goToDinner(s), !canGoToDinner(s))] });
  }
  if (f.outingOpen) {
    const o = currentOuting(s);
    items.push({ title: TEXTES.outingTitle, when: null, buttons: [bouton(o.cta, TEXTES.outingLines(fmtEur(o.price), OUTING_ENERGY), () => goOut(s), !canGoOut(s))] });
  }
  if (f.mamanRing) {
    const buttons = [bouton(TEXTES.mamanCta, TEXTES.mamanLines(energyMax(s)), () => answerMaman(s), !canAnswerMaman(s))];
    if (mamanIAOffered(s)) buttons.push(bouton(TEXTES.mamanIACta, TEXTES.mamanIALines, () => acceptMamanIA(s), false, TEXTES.free));
    items.push({ title: TEXTES.mamanTitle, when: TEXTES.dIciSunday, buttons });
  }
  const dici = isRevealed(s, "d_ici_lundi");
  if (dici && f.sites.length > 0) {
    const [title, when] = TEXTES.dIciMonday(f.sites.length, fmtEur(maintenancePossible(s)));
    items.push({ title, when, buttons: [] });
  }
  if (items.length === 0) return null;
  return { title: dici ? TEXTES.dIciLundiTitle : null, items };
}

// --- L'argent ---

export function vueSemaine(s: GameState): { title: string; net: string; rows: [string, string][] } | null {
  if (!isRevealed(s, "cette_semaine")) return null;
  const l = s.freelance.ledger;
  const n = net(l);
  return {
    title: TEXTES.weekTitle,
    net: TEXTES.signed(fmtEur(n), n),
    rows: [
      [TEXTES.entrees, TEXTES.signed(fmtEur(entrees(l)), 1)],
      [TEXTES.charges, fmtEur(-(chargesPro(l) + chargesPerso(l)))],
      [TEXTES.achats, fmtEur(-l.achats)],
    ],
  };
}

export interface VueBarre {
  label: string;
  livraisons: number;
  entretien: number;
  charges: number;
  current: boolean;
}
export function vueGagne(s: GameState): { title: string; big: string; delta: string | null; bars: VueBarre[]; note: string } | null {
  const h = s.freelance.history;
  if (!isRevealed(s, "menu") || h.length === 0) return null;
  const last = h[h.length - 1];
  const prev = h.length > 1 ? h[h.length - 2] : null;
  const diff = prev ? last.net - prev.net : 0;
  const delta = prev
    ? diff >= 0
      ? TEXTES.earnDelta(fmtEur(diff), h.length - 1)
      : TEXTES.earnDeltaDown(fmtEur(-diff), h.length - 1)
    : null;
  const first = Math.max(0, h.length - 8);
  const bars = h.slice(first).map((w, i) => ({
    label: `S${first + i + 1}`,
    livraisons: w.livraisons,
    entretien: w.entretien,
    charges: w.charges,
    current: first + i === h.length - 1,
  }));
  return { title: TEXTES.earnTitle, big: fmtEur(last.net), delta, bars, note: TEXTES.earnAchats };
}

export interface VueCompte {
  label: string;
  value: string;
  kind: "in" | "out" | "sub" | "net";
}
function ledgerRows(l: FlLedger): VueCompte[] {
  const rows: VueCompte[] = [{ label: TEXTES.entrees, value: TEXTES.signed(fmtEur(entrees(l)), 1), kind: "in" }];
  rows.push({ label: TEXTES.livraisons, value: fmtEur(l.livraisons), kind: "sub" });
  rows.push({ label: TEXTES.entretienOf(fmtEur(l.entretienPossible)), value: fmtEur(l.entretien), kind: "sub" });
  if (l.livret > 0) rows.push({ label: TEXTES.livret, value: fmtEur(l.livret), kind: "sub" });
  rows.push({ label: TEXTES.chargesPro, value: fmtEur(-chargesPro(l)), kind: "out" });
  if (l.abonnements > 0) rows.push({ label: TEXTES.abonnements, value: fmtEur(l.abonnements), kind: "sub" });
  if (l.salaires > 0) rows.push({ label: TEXTES.salaires, value: fmtEur(l.salaires), kind: "sub" });
  rows.push({ label: TEXTES.chargesPerso, value: fmtEur(-chargesPerso(l)), kind: "out" });
  if (l.loyer > 0) rows.push({ label: TEXTES.loyer, value: fmtEur(l.loyer), kind: "sub" });
  if (l.repas > 0) rows.push({ label: TEXTES.repas(l.repasCount), value: fmtEur(l.repas), kind: "sub" });
  if (l.sorties > 0) rows.push({ label: TEXTES.sorties, value: fmtEur(l.sorties), kind: "sub" });
  rows.push({ label: TEXTES.net, value: TEXTES.signed(fmtEur(net(l)), net(l)), kind: "net" });
  if (l.achats > 0) rows.push({ label: TEXTES.achats, value: fmtEur(-l.achats), kind: "out" });
  return rows;
}
export function vueFinances(s: GameState): {
  title: string;
  account: string;
  livret: string;
  livretRule: string;
  lastWeek: { title: string; rows: VueCompte[] } | null;
  deposit: Bouton;
  withdraw: Bouton;
} | null {
  if (!isRevealed(s, "menu")) return null;
  const f = s.freelance;
  return {
    title: TEXTES.financesTitle,
    account: fmtEur(s.money.toNumber()),
    livret: fmtEur(f.livretBalance),
    livretRule: TEXTES.livretRule,
    lastWeek: f.lastWeek ? { title: TEXTES.lastWeekTitle(f.history.length), rows: ledgerRows(f.lastWeek) } : null,
    deposit: bouton(TEXTES.deposit, [TEXTES.livretRule], () => depositAll(s), !canDeposit(s)),
    withdraw: bouton(TEXTES.withdraw, [TEXTES.withdrawSub], () => withdrawAll(s), !canWithdraw(s)),
  };
}

// --- La sortie ---

export function vueSortie(s: GameState): { title: string; lines: string[]; buy: Bouton } | null {
  if (!noraOffered(s)) return null;
  const f = s.freelance;
  const bugs = Math.max(bugsLast7Days(s), f.bugs.length);
  return {
    title: TEXTES.exitTitle(bugs),
    lines: [TEXTES.exitWhy(f.orders.length, fmtEur(waitingValue(s)))],
    buy: bouton(TEXTES.exitCta(companyName(s)), TEXTES.exitLines(fmtEur(NORA_SALARY)), () => hireNora(s)),
  };
}
export const vueFin = (s: GameState): string | null => (s.freelance.nora ? TEXTES.endLine : null);

export function vueSouvenirs(s: GameState, n = 5): { title: string; items: { text: string; missed: boolean }[] } | null {
  if (s.souvenirs.length === 0) return null;
  return {
    title: TEXTES.souvenirsTitle,
    items: s.souvenirs.slice(0, n).map((m) => ({ text: TEXTES.souvenir(m.day, m.text), missed: m.missed })),
  };
}
