import { describe, it, expect } from "vitest";
import { createInitialState, type GameState } from "../src/engine/state";
import { tick } from "../src/engine/loop";
import { work } from "../src/engine/actions";
import { D } from "../src/engine/numbers";
import {
  DAY_SECS,
  PEAK_SECS,
  START_COVERS,
  START_PILE,
  PILE_BASE_CAP,
  NOVELTY_GAP,
  REVEALS,
  REVEAL_BY_ID,
  MEAL_ENERGY,
  RELAUNCH_SECS,
  CALL_RING_SECS,
  CALL_TALK_SECS,
  WINDOW_IDLE_SECS,
  EQUIPMENT,
  ASKS,
  LIBRARY,
} from "../src/engine/content/plonge";
import {
  arrivalRate,
  pileCap,
  dayName,
  isPeak,
  clickPlates,
  noDirtyPlates,
  buyEquipment,
  canBuyEquipment,
  equipmentVisible,
  equipmentEffects,
  machineRate,
  autoIncomePerMin,
  currentAsk,
  canAskChef,
  askChef,
  askEffects,
  askStatus,
  chefVisible,
  coversVisible,
  canOfferSunday,
  offerSunday,
  canOpenLivret,
  openLivret,
  livretEffects,
  livretLine,
  cycleCourtAvailable,
  cycleCourtEffects,
  setCycleCourt,
  relaunchCycle,
  shelveGreasy,
  canAnswerCall,
  answerCall,
  callEffects,
  onThePhone,
  canLookOutWindow,
  lookOutWindow,
  lifeVisible,
  dayVisible,
  isRevealed,
  CONDITION_NAMES,
  canPoseGants,
  poseGantsEffects,
  libraryVisible,
  canBuyStudy,
  buyStudy,
  canStudyStep,
  studyStep,
  examPassed,
  canAnswerAnnonce,
  answerAnnonce,
  studyBuyEffects,
  mealVisible,
  canEat,
  eat,
  mealEffects,
} from "../src/engine/plonge";
import { poseGants } from "../src/engine/actions";
import { applyOffline } from "../src/engine/offline";
import { playthrough } from "./rythme/playthrough";
import { vueAmelioration, vueChef, vueBanque, vueEtudes, vueRepas, vueAppel, vuePoserGants, vueLaveVaisselle } from "../src/engine/plonge";

function fresh(): GameState {
  return createInitialState(0);
}

/** Avance le temps par petits pas (le moteur est intégré par ticks). */
function run(s: GameState, secs: number, dt = 0.05): void {
  for (let t = 0; t < secs - 1e-9; t += dt) tick(s, dt);
}

/** Rend l'offre d'un équipement prête (son heure est passée, la nouveauté qui l'annonce est révélée). */
function offerReady(s: GameState, id: string): void {
  const row = REVEAL_BY_ID[id];
  s.plonge.day = Math.max(s.plonge.day, row.at ?? 0);
  s.plonge.earned = Math.max(s.plonge.earned, row.earned ?? 0);
  for (const k of Object.keys(row.after ?? {})) if (REVEAL_BY_ID[k]?.kind === "jeu") s.plonge.revealed[k] ??= -1e6;
}

/** Donne tout l'équipement jusqu'à (inclus) l'id demandé, sans passer par la caisse ni attendre les révélations. */
function equipUpTo(s: GameState, id: string): void {
  for (const e of EQUIPMENT) {
    offerReady(s, e.id);
    s.money = s.money.add(e.cost);
    expect(buyEquipment(s, e.id)).toBe(true);
    s.plonge.boughtAt[e.id] = -1e6; // les révélations différées sont déjà passées
    if (e.id === id) break;
  }
  // Ce qui se serait déjà révélé en chemin : la file des nouveautés est libre pour le test.
  for (const k of ["pile", "chef", "grasses", "livret", "offre_pro"]) s.plonge.revealed[k] ??= 0;
  s.plonge.lastNovelty = -1e6;
}

/** Temps de calendrier au début du jour `d` (0 = premier lundi). */
const dayStart = (d: number): number => d * DAY_SECS;
/** Le premier dimanche où Maman peut appeler (4e dimanche). */
const FIRST_CALL_DAY = 27;

describe("Plongeur : le restaurant (calendrier, pile finie, affluence)", () => {
  it("démarre un lundi, un restaurant plein de 200 couverts, une petite pile qui t'attend", () => {
    const s = fresh();
    expect(dayName(s)).toBe("Lundi");
    expect(s.plonge.covers).toBe(START_COVERS);
    expect(s.plonge.pile).toBe(START_PILE);
    expect(clickPlates(s)).toBe(1); // le premier bouton n'est jamais grisé
  });

  it("les assiettes arrivent surtout pendant le coup de feu de midi", () => {
    const s = fresh();
    expect(isPeak(s)).toBe(true);
    const peak = arrivalRate(s);
    run(s, PEAK_SECS + 1);
    expect(isPeak(s)).toBe(false);
    expect(arrivalRate(s)).toBeLessThan(peak);
    // Sur une journée entière, on reçoit 3 assiettes par couvert (pile + ce que le chef a lavé).
    const t = fresh();
    t.plonge.pile = 0;
    run(t, DAY_SECS);
    expect(t.plonge.pile + t.plonge.overflow).toBeCloseTo(START_COVERS * 3, -1);
  });

  it("le restaurant salit plus vite que tu ne laves à la main : chaque achat de clic rapporte", () => {
    const avg = (START_COVERS * 3) / DAY_SECS;
    expect(avg).toBeGreaterThan(6 * EQUIPMENT.find((e) => e.id === "douchette")!.dishesPerClick!);
  });

  it("on ne lave pas plus d'assiettes que la pile n'en contient", () => {
    const s = fresh();
    s.plonge.pile = 0;
    work(s);
    expect(s.money.toNumber()).toBe(0); // pile vide : rien à laver
    s.plonge.pile = 1;
    s.dishesPerClick = 4;
    expect(clickPlates(s)).toBe(1);
    work(s);
    expect(s.money.toNumber()).toBeCloseTo(0.05);
    expect(s.plonge.pile).toBe(0);
  });

  it("le bouton ne dit « Aucune assiette sale » qu'après un instant de pile vide (il ne clignote pas)", () => {
    const s = fresh();
    s.plonge.day = dayStart(6) + 1; // dimanche, fermé : plus rien n'arrive
    s.plonge.pile = 0;
    tick(s, 0.5);
    expect(noDirtyPlates(s)).toBe(false);
    run(s, 1.5);
    expect(noDirtyPlates(s)).toBe(true);
  });

  it("au-delà de la capacité, le chef lave lui-même ; sa réplique s'efface quand la pile redescend", () => {
    const s = fresh();
    run(s, 3 * DAY_SECS);
    expect(s.plonge.pile).toBeLessThanOrEqual(pileCap(s) + 1e-6);
    expect(pileCap(s)).toBe(PILE_BASE_CAP + START_COVERS);
    expect(s.plonge.overflow).toBeGreaterThan(0);
    expect(s.plonge.chef).toBe("debut"); // le chef ne parle pas d'une pile que tu ne vois pas encore
    s.plonge.boughtAt["eponge"] = s.plonge.day; // l'éponge achetée : le compteur d'assiettes paraîtra
    run(s, 2 * DAY_SECS + 8); // un samedi
    expect(isRevealed(s, "pile")).toBe(true);
    expect(s.plonge.chef).toBe("debordement");
    expect(s.plonge.overflowToday).toBeGreaterThan(0);
    s.plonge.pile = 0;
    tick(s, 0.01);
    expect(s.plonge.chef).toBe("debut");
  });

  it("le compteur d'assiettes paraît 35 s après l'éponge, à la première pile vide (ou débordée)", () => {
    const s = fresh();
    s.plonge.pile = 0;
    s.plonge.day = 200;
    tick(s, 0.05);
    expect(isRevealed(s, "pile")).toBe(false); // pas d'éponge : pas de compteur
    s.plonge.boughtAt["gants"] = s.plonge.day;
    s.plonge.boughtAt["eponge"] = s.plonge.day;
    s.plonge.covers = 0; // plus rien n'arrive : la pile reste où on la met
    s.plonge.overflow = 0;
    s.plonge.pile = 0;
    run(s, 34);
    expect(isRevealed(s, "pile")).toBe(false); // trop tôt : une information à la fois
    s.plonge.pile = 5;
    run(s, 2);
    expect(isRevealed(s, "pile")).toBe(false); // la pile n'est ni vide ni débordée
    s.plonge.pile = 0;
    tick(s, 0.01);
    expect(isRevealed(s, "pile")).toBe(true);
  });

  it("sans éponge, le compteur paraît quand même 90 s après les gants", () => {
    const s = fresh();
    s.plonge.day = 200;
    s.plonge.boughtAt["gants"] = s.plonge.day;
    run(s, 89);
    expect(isRevealed(s, "pile")).toBe(false);
    run(s, 2);
    expect(isRevealed(s, "pile")).toBe(true); // le restaurant a débordé depuis longtemps
  });

  it("le restaurant est fermé le dimanche au départ", () => {
    const s = fresh();
    s.plonge.day = dayStart(6) + 1;
    expect(dayName(s)).toBe("Dimanche");
    expect(arrivalRate(s)).toBe(0);
  });
});

describe("Plongeur : l'équipement (objets uniques, statistique toujours affichée)", () => {
  it("chaque achat a au moins un sous-titre chiffré qui dit ce qui change", () => {
    const s = fresh();
    for (const e of EQUIPMENT) {
      const lines = equipmentEffects(s, e);
      expect(lines.length).toBeGreaterThan(0);
      for (const l of lines) expect(l).not.toMatch(/(\d+,\d\d €) → \1/); // jamais « A → A »
      offerReady(s, e.id);
      s.money = s.money.add(e.cost);
      buyEquipment(s, e.id);
      s.plonge.boughtAt[e.id] = -1e6;
    }
  });

  it("les gants se proposent dès le premier euro, et se dégrisent à 3 €", () => {
    const s = fresh();
    s.plonge.pile = 1000;
    for (let i = 0; i < 19; i++) work(s);
    expect(equipmentVisible(s, EQUIPMENT[0])).toBe(false); // 0,95 € : le bouton et l'argent, rien d'autre
    work(s);
    expect(equipmentVisible(s, EQUIPMENT[0])).toBe(true); // 1 €
    expect(canBuyEquipment(s, "gants")).toBe(false);
    for (let i = 0; i < 39; i++) work(s);
    expect(canBuyEquipment(s, "gants")).toBe(false); // 2,95 €
    work(s);
    expect(canBuyEquipment(s, "gants")).toBe(true); // 3 € (60 × 0,05 en virgule flottante : 2,9999… gagnés)
    expect(buyEquipment(s, "gants")).toBe(true);
    expect(equipmentVisible(s, EQUIPMENT[0])).toBe(false); // achetés : l'offre disparaît, l'argent retombé n'y change rien
  });

  it("les équipements se révèlent en chaîne et ne s'achètent qu'une fois", () => {
    const s = fresh();
    expect(equipmentVisible(s, EQUIPMENT[0])).toBe(false); // au début : le bouton et l'argent, rien d'autre
    s.plonge.earned = REVEAL_BY_ID.gants.earned!;
    expect(equipmentVisible(s, EQUIPMENT[0])).toBe(true);
    expect(equipmentVisible(s, EQUIPMENT[1])).toBe(false);
    s.money = D(10);
    expect(buyEquipment(s, "gants")).toBe(true);
    expect(s.dishesPerClick).toBe(2);
    expect(canBuyEquipment(s, "gants")).toBe(false);
    expect(equipmentVisible(s, EQUIPMENT[1])).toBe(true);
  });

  it("les deux premiers achats sont à 3 € et 6 €", () => {
    expect(EQUIPMENT[0].cost).toBe(3);
    expect(EQUIPMENT[1].cost).toBe(6);
  });

  it("une tâche manuelle ne s'automatise pas : sans clic ni machine, rien ne se lave", () => {
    const s = fresh();
    s.plonge.pile = 50;
    run(s, 5);
    expect(s.money.toNumber()).toBe(0);
    expect(s.plonge.pile).toBeGreaterThan(50);
  });

  it("la montre arrive 40 s après le compteur d'assiettes, et donne le jour", () => {
    const s = fresh();
    equipUpTo(s, "eponge");
    s.plonge.revealed["pile"] = s.plonge.day;
    const montre = EQUIPMENT.find((e) => e.id === "montre")!;
    s.plonge.day += 39;
    expect(equipmentVisible(s, montre)).toBe(false);
    s.plonge.day += 1;
    expect(equipmentVisible(s, montre)).toBe(true);
    expect(dayVisible(s)).toBe(false);
    s.money = D(montre.cost);
    buyEquipment(s, "montre");
    expect(dayVisible(s)).toBe(true);
    expect(equipmentEffects(fresh(), montre)).toContain("Affiche le jour de la semaine");
  });

  it("joint, panier et détartrage n'améliorent que la vieille machine ; le pro compte à part", () => {
    const s = fresh();
    equipUpTo(s, "reparer");
    expect(machineRate(s)).toBeCloseTo(6);
    const t = fresh();
    equipUpTo(t, "detartrer");
    expect(machineRate(t)).toBeCloseTo(6 * 1.5 ** 3);
    const u = fresh();
    equipUpTo(u, "pro");
    expect(machineRate(u)).toBeCloseTo(6 * 1.5 ** 3 + 40);
  });

  it("le lave-vaisselle pro ne se propose que dans la file des nouveautés", () => {
    const s = fresh();
    equipUpTo(s, "detartrer");
    delete s.plonge.revealed["offre_pro"];
    const pro = EQUIPMENT.find((e) => e.id === "pro")!;
    expect(equipmentVisible(s, pro)).toBe(false);
    s.plonge.revealed["offre_pro"] = s.plonge.day;
    expect(equipmentVisible(s, pro)).toBe(true);
  });

  it("le revenu automatique : les machines seules, hors clic, limitées par ce que le restaurant salit", () => {
    const s = fresh();
    expect(autoIncomePerMin(s)).toBe(0);
    equipUpTo(s, "reparer");
    expect(autoIncomePerMin(s)).toBeCloseTo(6 * (6 / 7) * 0.05 * 60, 5);
    s.dishesPerClick = 100;
    s.plonge.pile = 1000;
    work(s);
    expect(autoIncomePerMin(s)).toBeCloseTo(6 * (6 / 7) * 0.05 * 60, 5); // le clic n'y entre pas
    const u = fresh();
    equipUpTo(u, "pro");
    expect(autoIncomePerMin(u)).toBeCloseTo(((START_COVERS * 3) / DAY_SECS) * (6 / 7) * 0.05 * 60, 5);
    const r = equipmentEffects(fresh(), EQUIPMENT.find((e) => e.id === "reparer")!);
    expect(r.join(" ")).toMatch(/Il te rapporte 15,43 € \/ min/);
  });

  it("chaque amélioration de machine rapporte vraiment plus (l'offre devance la capacité)", () => {
    const s = fresh();
    equipUpTo(s, "gants_pro");
    for (const id of ["joint", "panier", "douchette", "detartrer"]) {
      const before = autoIncomePerMin(s);
      s.money = D(1000);
      expect(buyEquipment(s, id)).toBe(true);
      s.plonge.boughtAt[id] = -1e6;
      if (id !== "douchette") expect(autoIncomePerMin(s)).toBeGreaterThan(before);
    }
  });

  it("l'argent est exact dès le premier clic ; le livret A arrive bien plus tard", () => {
    const s = fresh();
    expect(canOpenLivret(s)).toBe(false);
    s.plonge.revealed["livret"] = 0;
    expect(canOpenLivret(s)).toBe(true);
    s.money = D(200);
    expect(livretEffects(s)).toEqual(["Chaque lundi : +5 % de ton argent", "Aujourd'hui, ce serait +10,00 €"]);
    openLivret(s);
    expect(livretLine(s)).toBe("Livret A : 5 % chaque lundi");
    // Lundi suivant : +5 %.
    s.plonge.day = dayStart(7) - 0.01;
    s.plonge.pile = 0;
    tick(s, 0.02);
    expect(s.money.toNumber()).toBeCloseTo(210, 5);
    expect(livretLine(s)).toBe("Livret A : +10,00 € lundi dernier");
  });

  it("le livret se propose 60 s après Maman en plein service, ou sans dimanche, bien plus tard", () => {
    const s = fresh();
    equipUpTo(s, "panier");
    s.plonge.boughtAt["panier"] = s.plonge.day;
    s.plonge.serviceCall = true;
    s.plonge.boughtAt["service_call"] = s.plonge.day;
    delete s.plonge.revealed["livret"];
    run(s, REVEAL_BY_ID.livret.after!.service_call - 1);
    expect(canOpenLivret(s)).toBe(false);
    run(s, 2);
    expect(canOpenLivret(s)).toBe(true);
  });
});

describe("Plongeur : le cycle court et les assiettes grasses", () => {
  function withCycleCourt(): GameState {
    const s = fresh();
    equipUpTo(s, "joint");
    expect(cycleCourtAvailable(s)).toBe(true);
    setCycleCourt(s);
    s.plonge.pile = 1e6;
    return s;
  }

  it("le cycle court accélère les deux machines de 30 %, et ça rapporte", () => {
    const s = fresh();
    equipUpTo(s, "joint");
    const before = machineRate(s);
    const income = autoIncomePerMin(s);
    expect(cycleCourtEffects(s).join(" ")).toMatch(/Il te rapporte/);
    setCycleCourt(s);
    expect(machineRate(s)).toBeCloseTo(before * 1.3);
    expect(autoIncomePerMin(s)).toBeGreaterThan(income);
  });

  it("une fournée sur cinq ressort grasse : la machine s'arrête", () => {
    const s = withCycleCourt();
    run(s, 45);
    expect(s.plonge.greasy).toBe(false);
    run(s, 6);
    expect(s.plonge.greasy).toBe(true);
    const money = s.money.toNumber();
    expect(autoIncomePerMin(s)).toBe(0);
    run(s, 5);
    expect(s.money.toNumber()).toBeCloseTo(money); // machine à l'arrêt : plus rien ne rentre
  });

  it("la première fournée grasse attend son tour derrière une nouveauté récente", () => {
    const s = withCycleCourt();
    delete s.plonge.revealed["grasses"];
    s.plonge.lastNovelty = s.plonge.day + 40; // une nouveauté vient d'arriver
    run(s, 51);
    expect(s.plonge.greasy).toBe(false);
  });

  it("relancer un cycle coûte 8 s de machine ; les ranger quand même ne coûte rien", () => {
    const a = withCycleCourt();
    run(a, 51);
    relaunchCycle(a);
    expect(a.plonge.greasy).toBe(false);
    const m0 = a.money.toNumber();
    run(a, RELAUNCH_SECS - 0.5);
    expect(a.money.toNumber()).toBeCloseTo(m0);
    run(a, 2);
    expect(a.money.toNumber()).toBeGreaterThan(m0);

    const b = withCycleCourt();
    run(b, 51);
    shelveGreasy(b);
    expect(b.plonge.greasy).toBe(false);
    expect(b.plonge.shelved).toBe(1);
    const m1 = b.money.toNumber();
    run(b, 1);
    expect(b.money.toNumber()).toBeGreaterThan(m1);
  });

  it("le client se plaint au service suivant (le chef essuie et ressert)", () => {
    const s = withCycleCourt();
    run(s, 51);
    shelveGreasy(s);
    s.plonge.pile = 0;
    s.plonge.day = dayStart(dayStartIndex(s) + 1) - 0.01;
    tick(s, 0.02);
    expect(s.plonge.chef).toBe("plainte");
  });

  it("avec le lave-vaisselle pro, plus d'assiettes grasses", () => {
    const s = fresh();
    equipUpTo(s, "pro");
    setCycleCourt(s);
    s.plonge.pile = 1e6;
    run(s, 120);
    expect(s.plonge.greasy).toBe(false);
  });
});

function dayStartIndex(s: GameState): number {
  return Math.floor(s.plonge.day / DAY_SECS);
}

describe("Plongeur : les demandes au chef (la réponse quand tu rattrapes le restaurant)", () => {
  function readyToAsk(): GameState {
    const s = fresh();
    equipUpTo(s, "reparer");
    s.plonge.revealed["chef"] = 0;
    s.plonge.day = dayStart(10) + PEAK_SECS + 0.5;
    s.plonge.emptyToday = 6;
    return s;
  }

  it("« Le chef » paraît un moment après la réparation, dans la file des nouveautés", () => {
    const s = fresh();
    equipUpTo(s, "reparer");
    delete s.plonge.revealed["chef"];
    s.plonge.boughtAt["reparer"] = s.plonge.day;
    s.plonge.pile = 0;
    run(s, REVEAL_BY_ID.chef.after!.reparer - 1);
    expect(chefVisible(s)).toBe(false);
    run(s, 2);
    expect(chefVisible(s)).toBe(true);
  });

  it("pas de demande tant que tu ne suis pas ; le bouton grisé dit la cible", () => {
    const s = readyToAsk();
    s.plonge.emptyToday = 2;
    expect(canAskChef(s)).toBe(false);
    s.dishesPerClick = 4;
    expect(askStatus(s)).toEqual([
      "Le chef dit oui si tu suis : moins de 4 assiettes sales pendant 6 s dans la journée",
      "Aujourd'hui : 2 s sur 6",
    ]);
  });

  it("tu suis quand il reste moins d'une brassée d'assiettes sales", () => {
    const s = readyToAsk();
    s.plonge.emptyToday = 0;
    s.dishesPerClick = 4;
    s.plonge.pile = 3;
    s.plonge.covers = 0; // plus rien n'arrive
    run(s, 6.5);
    expect(canAskChef(s)).toBe(true);
  });

  it("une demande : +couverts ; au plus une par jour", () => {
    const s = readyToAsk();
    expect(coversVisible(s)).toBe(false);
    expect(canAskChef(s)).toBe(true);
    const ask = currentAsk(s)!;
    expect(askEffects(s, ask)[0]).toMatch(/200 → 220/);
    expect(askChef(s)).toBe(true);
    expect(s.plonge.covers).toBe(START_COVERS + 20);
    expect(coversVisible(s)).toBe(true);
    s.plonge.emptyToday = 20;
    expect(canAskChef(s)).toBe(false);
    expect(askStatus(s)).toEqual(["Tu as déjà proposé aujourd'hui. Le chef répondra demain."]);
    s.plonge.day += DAY_SECS;
    expect(canAskChef(s)).toBe(true);
  });

  it("ouvrir le dimanche : proposé après le panier et un appel de Maman ; le sous-titre dit le prix de vie", () => {
    const s = fresh();
    equipUpTo(s, "panier");
    s.plonge.boughtAt["panier"] = s.plonge.day;
    run(s, REVEAL_BY_ID.dimanche.after!.panier + 1);
    expect(canOfferSunday(s)).toBe(false); // Maman n'a pas encore appelé
    s.plonge.revealed["maman"] = s.plonge.day;
    s.plonge.lastNovelty = -1e6;
    run(s, 0.1);
    expect(canOfferSunday(s)).toBe(true);
    expect(ASKS.some((a) => a.sunday)).toBe(false); // hors de la file des demandes
    offerSunday(s);
    expect(canOfferSunday(s)).toBe(false);
    s.plonge.day = dayStart(6) + 1;
    expect(arrivalRate(s)).toBeGreaterThan(0);
  });
});

describe("Plongeur : la vie perso (Maman, la fenêtre, les souvenirs)", () => {
  /** Le premier dimanche où Maman peut appeler. */
  function sundayNoon(s: GameState): void {
    s.plonge.day = dayStart(FIRST_CALL_DAY) - 0.01;
    tick(s, 0.05);
  }

  it("Maman n'appelle pas les premiers dimanches : « Ta vie » n'existe pas encore", () => {
    const s = fresh();
    s.plonge.day = dayStart(6) - 0.01;
    tick(s, 0.05);
    expect(canAnswerCall(s)).toBe(false);
    expect(lifeVisible(s)).toBe(false);
    sundayNoon(s);
    expect(canAnswerCall(s)).toBe(true);
    expect(lifeVisible(s)).toBe(true);
  });

  it("le premier appel attend son tour derrière une nouveauté récente", () => {
    const s = fresh();
    s.plonge.lastNovelty = dayStart(FIRST_CALL_DAY) - 1;
    sundayNoon(s);
    expect(canAnswerCall(s)).toBe(false);
  });

  it("au téléphone, tout s'arrête ; en raccrochant, l'énergie est pleine", () => {
    const s = fresh();
    equipUpTo(s, "reparer");
    sundayNoon(s);
    s.flags.energyVisible = true;
    s.energy = 10;
    expect(callEffects(s)).toContain("20 s au téléphone : tout s'arrête");
    expect(callEffects(s)).toContain("Énergie : 10 → 100");
    answerCall(s);
    expect(onThePhone(s)).toBe(true);
    s.plonge.pile = 100;
    s.dishesPerClick = 4;
    s.money = D(1000);
    work(s);
    expect(s.plonge.pile).toBe(100); // pas de plonge au téléphone
    expect(canBuyEquipment(s, "gants_pro")).toBe(false); // ni d'achat
    run(s, CALL_TALK_SECS + 0.5);
    expect(s.energy).toBe(100);
    expect(s.souvenirs[0].missed).toBe(false);
    expect(s.souvenirs[0].kind).toBe("lien");
  });

  it("décrocher en plein service coûte des assiettes, que le chef lave à ta place", () => {
    const s = fresh();
    equipUpTo(s, "reparer");
    s.plonge.sundayOpen = true;
    s.plonge.pile = 20;
    s.plonge.revealed["maman"] = 0; // Maman a déjà appelé un dimanche fermé
    sundayNoon(s);
    expect(s.plonge.serviceCall).toBe(true);
    expect(callEffects(s).join(" ")).toMatch(/Tu perds environ/);
    answerCall(s);
    const overflow = s.plonge.overflow;
    const pile = s.plonge.pile;
    run(s, CALL_TALK_SECS - 1);
    expect(s.plonge.overflow).toBeGreaterThan(overflow);
    expect(s.plonge.pile).toBeLessThanOrEqual(pile + 1e-6); // la pile ne monte plus pendant l'appel
  });

  it("un appel ignoré laisse un message vocal dans les souvenirs", () => {
    const s = fresh();
    sundayNoon(s);
    run(s, CALL_RING_SECS + 1);
    expect(canAnswerCall(s)).toBe(false);
    expect(s.souvenirs[0].missed).toBe(true);
  });

  it("« Regarder par la fenêtre » : après 20 s sans rien faire, une fois par jour, une fois « Ta vie » ouverte", () => {
    const s = fresh();
    run(s, WINDOW_IDLE_SECS + 1);
    expect(canLookOutWindow(s)).toBe(false); // pas de colonne « Ta vie » : pas de fenêtre
    sundayNoon(s);
    run(s, CALL_RING_SECS + 1); // appel manqué : « Ta vie » est née
    s.plonge.idle = 0;
    s.plonge.windowDay = -1;
    run(s, WINDOW_IDLE_SECS - 1);
    s.plonge.windowDay = -1;
    expect(canLookOutWindow(s)).toBe(false);
    s.plonge.idle = WINDOW_IDLE_SECS;
    expect(canLookOutWindow(s)).toBe(true);
    lookOutWindow(s);
    expect(s.souvenirs[0].missed).toBe(false);
    expect(s.souvenirs[0].kind).toBe("contemplation");
    expect(canLookOutWindow(s)).toBe(false);
    s.plonge.idle = WINDOW_IDLE_SECS + 1; // encore inactif, mais le même jour
    expect(canLookOutWindow(s)).toBe(false);
    run(s, DAY_SECS); // le lendemain, la fenêtre s'offre de nouveau
    expect(canLookOutWindow(s)).toBe(true);
  });
});

describe("Plongeur : poser les gants, la bibliothèque et l'énergie", () => {
  function retired(): GameState {
    const s = fresh();
    equipUpTo(s, "pro");
    poseGants(s);
    s.money = D(10000);
    return s;
  }

  it("« Poser les gants » n'est proposé qu'avec le lave-vaisselle pro", () => {
    const s = fresh();
    equipUpTo(s, "detartrer");
    expect(canPoseGants(s)).toBe(false);
    const t = fresh();
    equipUpTo(t, "pro");
    expect(canPoseGants(t)).toBe(true);
    expect(poseGantsEffects(t).length).toBeGreaterThan(0);
  });

  it("la bibliothèque s'ouvre avec le temps libre ; lire consomme de l'énergie", () => {
    const s = fresh();
    equipUpTo(s, "pro");
    expect(libraryVisible(s)).toBe(false);
    expect(s.flags.energyVisible).toBeFalsy();
    poseGants(s);
    expect(libraryVisible(s)).toBe(true);
    expect(s.flags.energyVisible).toBe(true); // l'énergie naît avec le temps libre
    s.money = D(1000);
    const html = LIBRARY[0];
    expect(canBuyStudy(s, LIBRARY[1].id)).toBe(false); // dans l'ordre
    expect(buyStudy(s, html.id)).toBe(true);
    s.energy = html.energy - 1;
    expect(canStudyStep(s, html.id)).toBe(false);
    s.energy = 100;
    studyStep(s, html.id);
    expect(s.energy).toBe(100 - html.energy);
    expect(s.plonge.library[html.id]).toBe(1);
  });

  it("chaque achat d'étude dit ce qu'il y a à faire et ce que ça coûte", () => {
    expect(studyBuyEffects(LIBRARY[0])).toEqual(["120 pages, 5 énergie les 10 pages"]);
    expect(studyBuyEffects(LIBRARY[1])).toEqual(["8 séances, 10 énergie par séance"]);
  });

  it("« Se faire à manger » redonne de l'énergie, deux fois par jour", () => {
    const s = retired();
    expect(mealVisible(s)).toBe(false);
    s.plonge.revealed["repas"] = s.plonge.day;
    s.energy = 50;
    expect(mealEffects(s)).toEqual(["Énergie : 50 → 60", "2 repas par jour"]);
    expect(eat(s)).toBe(true);
    expect(s.energy).toBe(50 + MEAL_ENERGY);
    expect(eat(s)).toBe(true);
    expect(canEat(s)).toBe(false);
    expect(mealEffects(s)).toEqual(["Tu as déjà mangé. Demain."]);
    s.plonge.day = dayStart(dayStartIndex(s) + 1) - 0.01;
    tick(s, 0.02);
    expect(canEat(s)).toBe(true);
  });

  it("le repas se révèle un moment après avoir posé les gants", () => {
    const s = retired();
    s.plonge.lastNovelty = -1e6;
    s.plonge.boughtAt["gants_poses"] = s.plonge.day;
    run(s, 30);
    expect(mealVisible(s)).toBe(false);
    run(s, NOVELTY_GAP);
    expect(mealVisible(s)).toBe(true);
  });

  it("l'examen ne s'ouvre qu'une fois le cours du soir terminé", () => {
    const s = retired();
    for (const id of ["html", "cours", "js", "ordi"]) buyStudy(s, id);
    expect(canBuyStudy(s, "examen")).toBe(false);
    s.plonge.library["cours"] = LIBRARY[1].steps;
    expect(canBuyStudy(s, "examen")).toBe(true);
  });

  it("l'examen réussi fait paraître l'annonce de Mme Duval, qui mène au développeur", () => {
    const s = retired();
    for (const item of LIBRARY) {
      expect(buyStudy(s, item.id)).toBe(true);
      for (let i = 0; i < item.steps; i++) {
        s.energy = 100;
        expect(studyStep(s, item.id)).toBe(true);
      }
    }
    expect(examPassed(s)).toBe(true);
    expect(canAnswerAnnonce(s)).toBe(true);
    expect(answerAnnonce(s)).toBe(true);
    expect(s.job).toBe("developpeur");
    expect(s.plonge.chef).toBe("annonce");
  });

  it("isRevealed garde la trace de chaque nouveauté", () => {
    const s = fresh();
    expect(isRevealed(s, "chef")).toBe(false);
  });
});

describe("Plongeur : le début du chapitre, une information à la fois", () => {
  it("les gants pro se proposent 35 s après l'arrivée du chef", () => {
    const s = fresh();
    equipUpTo(s, "reparer");
    delete s.plonge.revealed["chef"];
    const pro = EQUIPMENT.find((e) => e.id === "gants_pro")!;
    s.plonge.boughtAt["reparer"] = s.plonge.day - 1000;
    expect(equipmentVisible(s, pro)).toBe(false); // la réparation seule ne suffit plus
    s.plonge.revealed["chef"] = s.plonge.day;
    s.plonge.day += 34;
    expect(equipmentVisible(s, pro)).toBe(false);
    s.plonge.day += 1;
    expect(equipmentVisible(s, pro)).toBe(true);
  });

  it("à 2, 4 et 6 clics/s : gants tout de suite, puis éponge, compteur, montre, réparation, chef, gants pro, espacés", () => {
    const order = ["gants", "eponge", "pile", "montre", "reparer", "chef", "gants_pro"];
    for (const cps of [2, 4, 6]) {
      const r = playthrough(cps);
      const at = (k: string) => r.reveals.find((x) => x[0] === k)![1];
      expect(at("gants")).toBeLessThanOrEqual(20 / cps + 0.1); // le premier euro
      for (let i = 1; i < order.length; i++) expect(at(order[i])).toBeGreaterThan(at(order[i - 1]));
      for (const [a, b] of [["pile", "montre"], ["montre", "reparer"], ["chef", "gants_pro"]]) {
        expect(at(b) - at(a), `${a} → ${b} à ${cps} clics/s`).toBeGreaterThanOrEqual(30);
      }
      const bought = (k: string) => r.purchases.find((x) => x[0] === k)![1];
      expect(at("pile") - bought("eponge")).toBeCloseTo(35, 0);
    }
  });
});

describe("Plongeur : la table des nouveautés", () => {
  it("chaque équipement a sa ligne d'offre, et chaque offre est un équipement", () => {
    const offers = REVEALS.filter((r) => r.kind === "offre").map((r) => r.id);
    expect(offers.sort()).toEqual(EQUIPMENT.map((e) => e.id).sort());
  });

  it("une ligne ne cite que des conditions et des événements connus", () => {
    const events = new Set([...REVEALS.map((r) => r.id), "gants_poses", "service_call"]);
    for (const r of REVEALS) {
      for (const c of r.when ?? []) expect(CONDITION_NAMES).toContain(c);
      for (const k of [...Object.keys(r.after ?? {}), ...(r.needs ?? [])]) expect(events.has(k), `${r.id} → ${k}`).toBe(true);
    }
    expect(new Set(REVEALS.map((r) => r.id)).size).toBe(REVEALS.length); // une ligne par nouveauté
  });

  it("un geste paraît à l'instant de l'action (sans délai), et repousse la nouveauté suivante du jeu", () => {
    for (const r of REVEALS.filter((x) => x.kind === "geste")) {
      expect(r.at).toBeUndefined();
      for (const d of Object.values(r.after ?? {})) expect(d).toBe(0);
    }
    const s = fresh();
    equipUpTo(s, "eponge");
    s.plonge.day = 500;
    s.money = D(1000);
    expect(buyEquipment(s, "montre")).toBe(true);
    expect(s.plonge.lastNovelty).toBe(500); // le jour s'affiche : la file attend
    expect(isRevealed(s, "jour")).toBe(true);
  });
});

describe("Plongeur : l'écran (engine/plonge/vue.ts)", () => {
  it("sur toute une partie, chaque achat affiché porte un sous-titre, et aucun ne dit « A → A »", () => {
    const seen = new Set<string>();
    playthrough(4, {
      onStep: (s) => {
        const buys = [
          vueAmelioration(s)?.buy,
          ...(vueChef(s)?.offers ?? []),
          vueBanque(s)?.buy,
          vueEtudes(s)?.buy,
          ...(vueEtudes(s)?.items.map((i) => i.step) ?? []),
          vueRepas(s),
          vueAppel(s)?.answer,
          vuePoserGants(s),
          vueLaveVaisselle(s)?.cycleCourt,
        ];
        for (const b of buys) {
          if (!b) continue;
          seen.add(b.label);
          expect(b.lines.length, b.label).toBeGreaterThan(0);
          for (const l of b.lines) expect(l).not.toMatch(/(\d+,\d\d €) → \1/);
        }
      },
    });
    expect(seen.size).toBeGreaterThan(20); // la partie a bien tout traversé
  });
});

describe("Plongeur : hors-ligne et pacing", () => {
  it("le hors-ligne est plafonné à 10 min et limité par l'affluence", () => {
    const s = fresh();
    equipUpTo(s, "pro");
    s.money = D(0);
    s.lastSeen = 0;
    applyOffline(s, 4 * 3600 * 1000);
    const avgArrival = (START_COVERS * 3) / DAY_SECS; // bien sous la capacité des machines
    expect(s.money.toNumber()).toBeCloseTo(avgArrival * (6 / 7) * 0.05 * 600, 0);
  });

  it("le chapitre dure une vingtaine de minutes, sans blocage, une information à la fois", () => {
    const fast = playthrough(6);
    const mid = playthrough(4);
    const slow = playthrough(2);
    const afk = playthrough(4, { afk: true });
    const refuse = playthrough(4, { refuse: true });
    for (const r of [fast, mid, slow, afk, refuse]) expect(r.secs).toBeLessThan(40 * 60);
    expect(mid.secs).toBeGreaterThan(19 * 60);
    expect(mid.secs).toBeLessThan(27 * 60);
    for (const r of [fast, mid]) expect(r.maxGap).toBeLessThan(3 * 60 + 15);
    expect(slow.maxGap).toBeLessThan(4 * 60 + 30); // le joueur lent gagne lentement : ses paliers s'espacent
    // Au-delà des premières secondes, jamais deux nouveautés que le jeu révèle de lui-même dans la même demi-minute
    // (la conséquence immédiate d'un achat du joueur, comme le jour avec la montre, n'en est pas une).
    const spaced = ["gants", "pile", "montre", "reparer", "maman", "chef", "grasses", "dimanche", "service", "livret", "offre_pro", "repas", "annonce"];
    for (const r of [fast, mid, slow]) {
      const later = r.reveals.filter(([k, t]) => t > 5 && spaced.includes(k));
      for (let i = 1; i < later.length; i++) expect(later[i][1] - later[i - 1][1]).toBeGreaterThanOrEqual(29.9);
    }
    // Le compromis est rentable : le refuser rallonge, sans dépasser +20 %.
    expect(refuse.secs).toBeGreaterThan(mid.secs);
    expect(refuse.secs).toBeLessThan(mid.secs * 1.2);
    for (const r of [fast, mid, slow, refuse]) expect(r.deadMax).toBeLessThan(20.5); // jamais plus de 20 s d'affilée sans rien d'utile à faire
  });
});
