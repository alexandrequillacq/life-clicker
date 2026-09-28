import { describe, it, expect } from "vitest";
import { createInitialState, type GameState } from "../src/engine/state";
import { tick } from "../src/engine/loop";
import { work, poseGants } from "../src/engine/actions";
import { D } from "../src/engine/numbers";
import { applyOffline } from "../src/engine/offline";
import {
  DAY_SECS,
  START_COVERS,
  ASK_MIN_GAP,
  ASK_LATE,
  START_PILE,
  PILE_BASE_CAP,
  NOVELTY_GAP,
  MEAL_ENERGY,
  RELAUNCH_SECS,
  LOAD_SECS,
  GREASY_EVERY,
  CALL_SOUVENIRS,
  WINDOW_LINES,
  WINDOW_LINES_HOME,
  KEEP_UP_SECS,
  LIVRET_RATE,
  EQUIPMENT,
  CONCESSIONS,
  ASKS,
  LIBRARY,
  REVEALS,
  CHEF_LINES,
} from "../src/engine/content/plonge";
import {
  arrivalRate,
  openDayArrivalRate,
  pileCap,
  dayName,
  clickPlates,
  noDirtyPlates,
  buyEquipment,
  canBuyEquipment,
  equipmentVisible,
  equipmentEffects,
  machineRate,
  autoIncomePerMin,
  concessionVisible,
  concessionEffects,
  takeConcession,
  currentAsk,
  canAskChef,
  askChef,
  askEffects,
  chefVisible,
  coversVisible,
  canOfferSunday,
  offerSunday,
  canOpenLivret,
  openLivret,
  depositLivret,
  withdrawLivret,
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
  studyStep,
  examPassed,
  canAnswerAnnonce,
  answerAnnonce,
  studyBuyEffects,
  mealVisible,
  canEat,
  eat,
  mealEffects,
  vueJour,
  vuePile,
  vueLaveVaisselle,
  vueAmelioration,
  vueChef,
  vueFenetre,
  vueBanque,
  vueEtudes,
  vueRepas,
  vueAppel,
  vuePoserGants,
  vueConcessions,
} from "../src/engine/plonge";
import { playthrough } from "./rythme/playthrough";

function fresh(): GameState {
  return createInitialState(0);
}

/** Avance le temps par petits pas (le moteur est intégré par ticks). */
function run(s: GameState, secs: number, dt = 0.05): void {
  for (let t = 0; t < secs - 1e-9; t += dt) tick(s, dt);
}

/** Donne tout l'équipement jusqu'à (inclus) l'id demandé, sans passer par la caisse ni attendre les révélations. */
function equipUpTo(s: GameState, id: string): void {
  for (const e of EQUIPMENT) {
    if (!s.plonge.equipment[e.id]) {
      if (e.id === "detartrer_pro") s.plonge.boughtAt["gants_poses"] ??= -1e6; // les améliorations du pro viennent avec les études
      s.plonge.revealed[e.id] ??= -1e6; // l'offre est déjà proposée
      s.money = s.money.add(e.cost);
      expect(buyEquipment(s, e.id), e.id).toBe(true);
      s.plonge.boughtAt[e.id] = -1e6; // les délais sont passés
    }
    if (e.id === id) break;
  }
  for (const k of ["pile", "chef", "grasses"]) s.plonge.revealed[k] ??= -1e6;
  s.plonge.lastNovelty = -1e6;
}

/** Temps de calendrier au début du jour `d` (0 = premier lundi). */
const dayStart = (d: number): number => d * DAY_SECS;
const dayIdx = (s: GameState): number => Math.floor(s.plonge.day / DAY_SECS);
/** Le premier dimanche où Maman peut appeler (4e dimanche). */
const FIRST_CALL_DAY = 27;
/** Passe au début du dimanche `d`. */
function toSunday(s: GameState, d = FIRST_CALL_DAY): void {
  s.plonge.day = dayStart(d) - 0.01;
  tick(s, 0.05);
}

describe("Plongeur : le restaurant (calendrier, pile finie, arrivées régulières)", () => {
  it("démarre un lundi : 50 couverts, une assiette par couvert, une petite pile qui t'attend", () => {
    const s = fresh();
    expect(dayName(s)).toBe("Lundi");
    expect(s.plonge.covers).toBe(START_COVERS);
    expect(s.plonge.pile).toBe(START_PILE);
    expect(clickPlates(s)).toBe(1); // le premier bouton n'est jamais grisé
  });

  it("les assiettes arrivent régulièrement, sans coup de feu ; rien le dimanche", () => {
    const s = fresh();
    const r0 = arrivalRate(s);
    expect(r0).toBeCloseTo(START_COVERS / DAY_SECS);
    run(s, 7);
    expect(arrivalRate(s)).toBeCloseTo(r0);
    const t = fresh();
    t.plonge.pile = 0;
    run(t, DAY_SECS);
    expect(t.plonge.pile).toBeCloseTo(START_COVERS, 0); // un jour : un couvert, une assiette
    t.plonge.day = dayStart(6) + 1;
    expect(dayName(t)).toBe("Dimanche");
    expect(arrivalRate(t)).toBe(0);
  });

  it("on ne lave pas plus d'assiettes que la pile n'en contient", () => {
    const s = fresh();
    s.plonge.pile = 0;
    work(s);
    expect(s.money.toNumber()).toBe(0);
    s.plonge.pile = 1;
    s.dishesPerClick = 4;
    expect(clickPlates(s)).toBe(1);
    work(s);
    expect(s.money.toNumber()).toBeCloseTo(0.05);
  });

  it("le bouton ne dit « Aucune assiette sale » qu'après un instant de pile vide", () => {
    const s = fresh();
    s.plonge.day = dayStart(6) + 1;
    s.plonge.pile = 0;
    tick(s, 0.5);
    expect(noDirtyPlates(s)).toBe(false);
    run(s, 1.5);
    expect(noDirtyPlates(s)).toBe(true);
  });

  it("au-delà de la capacité, le chef lave lui-même, sans un mot de plus ; sa réplique s'efface quand la pile redescend", () => {
    expect(CHEF_LINES.debordement).toBe("Le chef a fait la plonge lui-même.");
    const s = fresh();
    s.plonge.covers = 2000;
    s.plonge.pile = pileCap(s) - 10;
    run(s, 2);
    expect(s.plonge.pile).toBeLessThanOrEqual(pileCap(s) + 1e-6);
    expect(pileCap(s)).toBe(PILE_BASE_CAP + 2000);
    expect(s.plonge.overflow).toBeGreaterThan(0);
    expect(s.plonge.chef).toBe("debut"); // le chef ne parle pas d'une pile que tu ne vois pas encore
    s.plonge.revealed["pile"] = s.plonge.day;
    run(s, DAY_SECS);
    expect(s.plonge.chef).toBe("debordement");
    s.plonge.pile = 0;
    tick(s, 0.01);
    expect(s.plonge.chef).toBe("debut");
  });

  it("le dimanche, avant la montre, l'écran dit seulement qu'il n'y a pas d'assiette ; avec la montre, que c'est fermé", () => {
    const s = fresh();
    s.plonge.revealed["pile"] = 0;
    s.plonge.day = dayStart(6) + 1;
    expect(vueJour(s)).toBeNull();
    expect(vuePile(s)).toContain("Pas d'assiette supplémentaire aujourd'hui.");
    s.plonge.boughtAt["montre"] = 0;
    expect(vueJour(s)).toBe("Dimanche, restaurant fermé");
    expect(vuePile(s)).not.toContain("Pas d'assiette supplémentaire aujourd'hui.");
    s.plonge.day = dayStart(7) + 1;
    expect(vueJour(s)).toBe("Lundi");
  });
});

describe("Plongeur : une information à la fois (la table des nouveautés)", () => {
  it("au premier euro : le compteur d'assiettes et les gants, grisés jusqu'à 3 €", () => {
    const s = fresh();
    s.plonge.pile = 1000;
    for (let i = 0; i < 19; i++) work(s);
    tick(s, 0.01);
    expect(isRevealed(s, "pile")).toBe(false);
    expect(equipmentVisible(s, EQUIPMENT[0])).toBe(false);
    work(s);
    tick(s, 0.01);
    expect(isRevealed(s, "pile")).toBe(true);
    expect(equipmentVisible(s, EQUIPMENT[0])).toBe(true);
    expect(canBuyEquipment(s, "gants")).toBe(false);
    for (let i = 0; i < 40; i++) work(s);
    expect(canBuyEquipment(s, "gants")).toBe(true); // 60 × 0,05 en virgule flottante : 2,9999… gagnés
    expect(EQUIPMENT[0].cta).toBe("Acheter des gants de plonge");
  });

  it("« Le chef » paraît après les gants, en attendant son tour dans la file", () => {
    const s = fresh();
    s.plonge.revealed["pile"] = 0;
    s.plonge.lastNovelty = 0;
    s.plonge.day = 20;
    s.plonge.equipment["gants"] = true;
    s.plonge.boughtAt["gants"] = 20;
    tick(s, 0.05);
    expect(chefVisible(s)).toBe(false); // le compteur vient d'arriver
    s.plonge.day = NOVELTY_GAP;
    tick(s, 0.05);
    expect(chefVisible(s)).toBe(true);
  });

  it("une amélioration se propose quand tu ne suis plus le restaurant, et le reste", () => {
    const s = fresh();
    s.plonge.equipment["gants"] = true;
    s.plonge.boughtAt["gants"] = 0;
    s.dishesPerClick = 2;
    s.plonge.pile = 0;
    s.plonge.covers = 0;
    run(s, 10);
    expect(equipmentVisible(s, EQUIPMENT[1])).toBe(false); // tu suis : l'éponge ne rapporterait rien
    s.plonge.day = dayStart(1); // une nouvelle journée
    s.plonge.pile = 50; // plus de deux clics d'assiettes sales
    run(s, 6.5);
    expect(equipmentVisible(s, EQUIPMENT[1])).toBe(true);
    s.plonge.pile = 0;
    run(s, DAY_SECS);
    expect(equipmentVisible(s, EQUIPMENT[1])).toBe(true); // une fois proposée, elle reste
  });

  it("sans jamais être à la traîne, l'amélioration suivante se propose quand même 120 s après la précédente", () => {
    const s = fresh();
    s.plonge.equipment["gants"] = true;
    s.plonge.boughtAt["gants"] = 0;
    s.plonge.pile = 0;
    s.plonge.covers = 0;
    run(s, 119);
    expect(equipmentVisible(s, EQUIPMENT[1])).toBe(false);
    run(s, 2);
    expect(equipmentVisible(s, EQUIPMENT[1])).toBe(true);
  });

  it("la montre d'occasion se propose 30 s après l'éponge, à 15 €, et donne le jour", () => {
    const s = fresh();
    equipUpTo(s, "eponge");
    s.plonge.boughtAt["eponge"] = 100;
    s.plonge.day = 129;
    tick(s, 0.05);
    const montre = EQUIPMENT.find((e) => e.id === "montre")!;
    expect(equipmentVisible(s, montre)).toBe(false);
    s.plonge.day = 130;
    tick(s, 0.05);
    expect(equipmentVisible(s, montre)).toBe(true);
    expect(montre.cost).toBe(15);
    expect(montre.cta).toBe("S'acheter une montre d'occasion");
    expect(equipmentEffects(s, montre)).toContain("Pour savoir quel jour on est");
    expect(dayVisible(s)).toBe(false);
    s.money = D(15);
    buyEquipment(s, "montre");
    expect(dayVisible(s)).toBe(true);
  });

  it("chaque ligne ne cite que des conditions et des événements connus ; chaque équipement et chaque concession a son offre", () => {
    const events = new Set([
      ...REVEALS.map((r) => r.id),
      ...ASKS.map((a) => a.id),
      ...LIBRARY.map((l) => l.id),
      "gants_poses",
      "service_call",
      "appel_3",
      "sonnerie_5",
    ]);
    for (const r of REVEALS) {
      for (const c of r.when ?? []) expect(CONDITION_NAMES).toContain(c);
      const keys = [...Object.keys(r.after ?? {}), ...(r.needs ?? []), ...Object.keys(r.fallback ?? {})];
      for (const k of keys) expect(events.has(k), `${r.id} → ${k}`).toBe(true);
    }
    expect(new Set(REVEALS.map((r) => r.id)).size).toBe(REVEALS.length);
    const offers = REVEALS.filter((r) => r.kind === "offre").map((r) => r.id).sort();
    expect(offers).toEqual([...EQUIPMENT.map((e) => e.id), ...CONCESSIONS.map((c) => c.id)].sort());
    for (const r of REVEALS.filter((x) => x.kind === "geste")) {
      for (const d of Object.values(r.after ?? {})) expect(d).toBe(0); // un geste paraît à l'instant de l'action
    }
  });

  it("un achat qui change l'écran repousse la nouveauté suivante du jeu", () => {
    const s = fresh();
    equipUpTo(s, "eponge");
    s.plonge.day = 500;
    s.plonge.revealed["montre"] = 0;
    s.money = D(100);
    expect(buyEquipment(s, "montre")).toBe(true);
    expect(s.plonge.lastNovelty).toBe(500);
  });
});

describe("Plongeur : l'équipement (objets uniques, statistique toujours affichée)", () => {
  it("chaque achat a un sous-titre chiffré qui dit ce qui change, jamais « A → A »", () => {
    const s = fresh();
    s.plonge.covers = 100000; // le restaurant ne limite rien : chaque machine rapporte
    for (const e of EQUIPMENT) {
      const lines = equipmentEffects(s, e);
      expect(lines.length, e.id).toBeGreaterThan(0);
      for (const l of lines) expect(l, e.id).not.toMatch(/(\d+(,\d+)?( €)?) → \1(?![\d,])/);
      equipUpTo(s, e.id);
    }
  });

  it("les verbes d'achat : on achète, on s'achète, on installe, on répare", () => {
    for (const e of EQUIPMENT) expect(e.cta).toMatch(/^(Acheter|S'acheter|Installer|Réparer|Changer|Détartrer|Payer)/);
  });

  it("une tâche manuelle ne s'automatise pas : sans clic ni machine, rien ne se lave", () => {
    const s = fresh();
    s.plonge.pile = 50;
    run(s, 5);
    expect(s.money.toNumber()).toBe(0);
  });

  it("le vieux lave-vaisselle et ses réglages, puis le pro, le détartrage du pro, le deuxième pro, l'adoucisseur", () => {
    const at = (id: string): number => {
      const s = fresh();
      equipUpTo(s, id);
      return machineRate(s);
    };
    expect(at("reparer")).toBeCloseTo(10);
    expect(at("detartrer")).toBeCloseTo(10 * 1.5 ** 3);
    expect(at("pro")).toBeCloseTo(10 * 1.5 ** 3 + 60);
    expect(at("detartrer_pro")).toBeCloseTo(10 * 1.5 ** 3 + 60 * 1.25);
    expect(at("pro2")).toBeCloseTo(10 * 1.5 ** 3 + 60 * 1.25 + 60); // le neuf n'a pas été détartré
    expect(at("adoucisseur")).toBeCloseTo((10 * 1.5 ** 3 + 60 * 1.25 + 60) * 1.2); // l'eau adoucie sert à toutes les machines
  });

  it("le revenu automatique : les machines seules, hors clic, limitées par ce que le restaurant salit", () => {
    const s = fresh();
    expect(autoIncomePerMin(s)).toBe(0);
    equipUpTo(s, "reparer");
    s.plonge.covers = 1000;
    expect(autoIncomePerMin(s)).toBeCloseTo(10 * (6 / 7) * 0.05 * 60, 5);
    s.plonge.covers = 60; // 4 assiettes / s
    expect(autoIncomePerMin(s)).toBeCloseTo(4 * (6 / 7) * 0.05 * 60, 5);
  });
});

describe("Plongeur : les concessions (gratuites, de plus en plus grosses)", () => {
  it("« Ne passer qu'un coup d'éponge par assiette » : +20 % par clic, arrondi, pour toujours", () => {
    const s = fresh();
    equipUpTo(s, "eponge_pro");
    s.plonge.revealed["approximatif"] = 0;
    expect(concessionVisible(s, "approximatif")).toBe(true);
    expect(concessionEffects(s, "approximatif")).toContain("Par clic : 5 → 6 assiettes");
    takeConcession(s, "approximatif");
    expect(s.dishesPerClick).toBe(6);
    expect(concessionVisible(s, "approximatif")).toBe(false);
    equipUpTo(s, "douchette");
    expect(s.dishesPerClick).toBe(7); // 6 × 1,2
  });

  it("le cycle court : +30 % ; une fournée sur quatre ressort grasse et se relave toute seule, sans rien bloquer", () => {
    const s = fresh();
    equipUpTo(s, "joint");
    s.plonge.covers = 100000;
    const before = machineRate(s);
    s.plonge.revealed["cycle_court"] = 0;
    expect(concessionEffects(s, "cycle_court").join(" ")).toMatch(/€ → .* € \/ minute/);
    takeConcession(s, "cycle_court");
    expect(machineRate(s)).toBeCloseTo(before * 1.3);
    s.plonge.pile = 1e6;
    run(s, LOAD_SECS * GREASY_EVERY - 1);
    expect(s.plonge.relaunchLeft).toBe(0);
    run(s, 1.5);
    expect(s.plonge.relaunchLeft).toBeGreaterThan(RELAUNCH_SECS - 1); // elle relave
    const m = s.money.toNumber();
    run(s, 2);
    expect(s.money.toNumber()).toBeCloseTo(m); // pendant le relavage, le vieux ne sort rien
  });

  it("la première fournée grasse attend son tour derrière une nouveauté récente", () => {
    const s = fresh();
    equipUpTo(s, "joint");
    s.plonge.revealed["cycle_court"] = 0;
    takeConcession(s, "cycle_court");
    delete s.plonge.revealed["grasses"];
    s.plonge.lastNovelty = s.plonge.day + 1000;
    s.plonge.pile = 1e6;
    run(s, LOAD_SECS * GREASY_EVERY + 1);
    expect(s.plonge.relaunchLeft).toBe(0);
  });

  it("« Ne plus relaver les assiettes grasses » : plus de relavage, le client se plaint au service suivant", () => {
    const s = fresh();
    equipUpTo(s, "joint");
    s.plonge.covers = 100000;
    s.plonge.revealed["cycle_court"] = 0;
    takeConcession(s, "cycle_court");
    s.plonge.revealed["sans_relavage"] = 0;
    expect(concessionEffects(s, "sans_relavage").join(" ")).toMatch(/→/);
    takeConcession(s, "sans_relavage");
    s.plonge.pile = 1e6;
    run(s, LOAD_SECS * GREASY_EVERY + 1);
    expect(s.plonge.relaunchLeft).toBe(0);
    s.plonge.day = dayStart(dayIdx(s) + 1) - 0.01;
    tick(s, 0.02);
    expect(s.plonge.chef).toBe("plainte");
  });

  it("avec le lave-vaisselle pro, plus d'assiettes grasses", () => {
    const s = fresh();
    equipUpTo(s, "pro");
    s.plonge.revealed["cycle_court"] = 0;
    takeConcession(s, "cycle_court");
    expect(machineRate(s)).toBeCloseTo(10 * 1.5 ** 3 * 1.3 + 60); // le cycle court est un programme du vieux
    s.plonge.pile = 1e6;
    run(s, 120);
    expect(s.plonge.relaunchLeft).toBe(0);
  });
});

describe("Plongeur : les demandes au chef (un clic, il dit oui ; la suivante vient quand tu suis)", () => {
  /** Le chef vient de paraître : la première demande est là. */
  function readyToAsk(): GameState {
    const s = fresh();
    s.plonge.revealed["chef"] = 0;
    s.plonge.day = dayStart(10) + 1;
    tick(s, 0.01);
    return s;
  }
  /** Juste après une demande acceptée, dans un restaurant vide (la pile ne se remplit que si le test le veut). */
  function justAsked(): GameState {
    const s = readyToAsk();
    expect(askChef(s)).toBe(true);
    s.plonge.covers = 0;
    s.plonge.pile = 0;
    return s;
  }

  it("la première demande vient avec le chef ; un clic, sans condition, et les couverts augmentent", () => {
    expect(ASKS.some((a) => a.id === "groupes")).toBe(false);
    const s = readyToAsk();
    s.plonge.pile = 50; // même si tu ne suis pas
    const offer = vueChef(s)!.offers[0];
    expect(offer.disabled).toBe(false);
    expect(offer.lines).toEqual(["Couverts par jour : 50 → 90", "1 couvert = 1 assiette sale"]);
    expect(coversVisible(s)).toBe(false);
    offer.act();
    expect(s.plonge.covers).toBe(90);
    expect(coversVisible(s)).toBe(true);
    expect(vueChef(s)).toBeNull(); // la suivante attend
  });

  it("la suivante se propose quand tu suis (6 s de pile vide), jamais moins de 35 s après ; une fois proposée, elle reste", () => {
    const s = justAsked();
    run(s, 10);
    expect(s.plonge.keptUp).toBeGreaterThanOrEqual(KEEP_UP_SECS);
    expect(canAskChef(s)).toBe(false); // trop tôt
    run(s, ASK_MIN_GAP - 10 + 0.1);
    expect(canAskChef(s)).toBe(true);
    s.plonge.pile = 50;
    run(s, 20);
    expect(canAskChef(s)).toBe(true);
  });

  it("sans jamais suivre, la suivante se propose 120 s après la précédente, si la pile tient en deux brassées", () => {
    const s = justAsked();
    s.dishesPerClick = 30;
    s.plonge.pile = 100; // plus de deux clics sales : c'est une amélioration qu'il te faut, pas plus de couverts
    run(s, ASK_LATE + 1);
    expect(canAskChef(s)).toBe(false);
    s.plonge.pile = 40; // entre un et deux clics
    run(s, 0.1);
    expect(s.plonge.keptUp).toBe(0);
    expect(canAskChef(s)).toBe(true);
  });

  it("les gants posés, une demande n'arrive que si les lave-vaisselle peuvent laver ce qu'elle ajoute", () => {
    const s = readyToAsk();
    equipUpTo(s, "pro");
    poseGants(s);
    s.plonge.asksDone = ASKS.findIndex((a) => a.id === "deuxieme_restaurant");
    s.plonge.covers = 1600;
    expect(machineRate(s)).toBeLessThan((1600 + 800) / DAY_SECS);
    expect(currentAsk(s)).toBeNull(); // 2400 couverts : 160 assiettes / seconde, trop pour les machines
    s.plonge.proRate = 200;
    expect(askEffects(s, currentAsk(s)!)).toContain("Couverts par jour : 1600 → 2400");
    s.plonge.askShown = true;
    askChef(s);
    expect(s.plonge.covers).toBe(2400);
    expect(s.plonge.boughtAt["deuxieme_restaurant"]).toBeDefined();
  });

  it("suivre ne compte que les jours ouverts (le dimanche fermé vide la pile de lui-même)", () => {
    const s = justAsked();
    s.plonge.day = dayStart(13) + 0.5; // un dimanche
    run(s, 10);
    expect(s.plonge.keptUp).toBe(0);
  });


  it("ouvrir le dimanche : proposé après le 3e appel décroché ; le sous-titre dit le prix de vie", () => {
    const s = fresh();
    s.plonge.boughtAt["appel_2"] = 0;
    run(s, 1);
    expect(canOfferSunday(s)).toBe(false);
    s.plonge.boughtAt["appel_3"] = s.plonge.day;
    run(s, 0.1);
    expect(canOfferSunday(s)).toBe(true);
    expect(vueChef(s)!.offers[0].lines).toContain("Tu travailles le dimanche.");
    offerSunday(s);
    s.plonge.day = dayStart(6) + 1;
    expect(arrivalRate(s)).toBeGreaterThan(0);
  });

  it("sans jamais décrocher, le dimanche se propose quand même au 5e appel", () => {
    const s = fresh();
    s.plonge.boughtAt["sonnerie_5"] = 0;
    run(s, 0.1);
    expect(canOfferSunday(s)).toBe(true);
  });
});

describe("Plongeur : Maman (le dimanche), la fenêtre, les souvenirs", () => {
  it("Maman n'appelle pas les premiers dimanches, puis sonne tout le dimanche", () => {
    const s = fresh();
    toSunday(s, 6);
    expect(canAnswerCall(s)).toBe(false);
    expect(lifeVisible(s)).toBe(false);
    toSunday(s);
    expect(canAnswerCall(s)).toBe(true);
    expect(lifeVisible(s)).toBe(true);
    run(s, DAY_SECS - 1);
    expect(canAnswerCall(s)).toBe(true); // elle sonne encore en fin de journée
    run(s, 1.5);
    expect(canAnswerCall(s)).toBe(false);
    expect(s.souvenirs[0]).toMatchObject({ day: "Dimanche", missed: true });
    expect(s.plonge.boughtAt["sonnerie_1"]).toBeDefined();
  });

  it("décrocher bloque tout jusqu'à lundi, sauf les machines ; énergie pleine ; le souvenir est daté du dimanche", () => {
    const s = fresh();
    equipUpTo(s, "reparer");
    s.plonge.covers = 1000;
    toSunday(s);
    s.flags.energyVisible = true;
    s.energy = 10;
    expect(callEffects(s)).toContain("Au téléphone jusqu'à lundi : tout s'arrête, sauf les machines");
    expect(callEffects(s)).toContain("Énergie : 10 → 100");
    run(s, 5);
    answerCall(s);
    expect(onThePhone(s)).toBe(true);
    expect(s.plonge.callTalk).toBeCloseTo(DAY_SECS - 5.05, 0);
    s.plonge.pile = 100;
    s.dishesPerClick = 4;
    work(s);
    expect(s.plonge.pile).toBe(100); // pas de plonge au téléphone
    const m = s.money.toNumber();
    run(s, 2);
    expect(s.money.toNumber()).toBeGreaterThan(m); // la machine, elle, lave
    run(s, DAY_SECS);
    expect(onThePhone(s)).toBe(false);
    expect(s.energy).toBeGreaterThan(99);
    expect(s.souvenirs[0]).toMatchObject({ day: "Dimanche", missed: false, kind: "lien" });
    expect(s.plonge.callsAnswered).toBe(1);
    expect(s.plonge.boughtAt["appel_1"]).toBeDefined();
  });

  it("décrocher en plein service coûte des assiettes, que le chef lave à ta place", () => {
    const s = fresh();
    equipUpTo(s, "reparer");
    s.plonge.sundayOpen = true;
    s.plonge.revealed["maman"] = 0;
    s.plonge.covers = 600;
    toSunday(s);
    expect(s.plonge.serviceCall).toBe(true);
    expect(callEffects(s).join(" ")).toMatch(/Tu perds environ/);
    answerCall(s);
    const overflow = s.plonge.overflow;
    run(s, 5);
    expect(s.plonge.overflow).toBeGreaterThan(overflow);
  });

  it("« Regarder par la fenêtre » : tous les 2 jours, sans condition, une fois « Ta vie » ouverte ; +20 d'énergie une fois les gants posés", () => {
    const s = fresh();
    run(s, DAY_SECS * 3);
    expect(canLookOutWindow(s)).toBe(false); // « Ta vie » n'est pas encore née
    toSunday(s);
    expect(canLookOutWindow(s)).toBe(false); // pas pendant que Maman sonne
    run(s, DAY_SECS); // appel manqué : « Ta vie » est née
    expect(canLookOutWindow(s)).toBe(true);
    expect(vueFenetre(s)!.lines).toEqual([]); // l'énergie ne se voit pas encore
    lookOutWindow(s);
    expect(s.souvenirs[0].kind).toBe("contemplation");
    run(s, DAY_SECS);
    expect(canLookOutWindow(s)).toBe(false);
    run(s, DAY_SECS);
    expect(canLookOutWindow(s)).toBe(true);
    s.flags.energyVisible = true;
    s.energy = 50;
    expect(vueFenetre(s)!.lines).toEqual(["Énergie : 50 → 70"]);
    lookOutWindow(s);
    expect(s.energy).toBe(70);
  });

  it("Maman et la fenêtre ont chacune au moins 50 phrases, toutes différentes", () => {
    expect(new Set(CALL_SOUVENIRS).size).toBe(CALL_SOUVENIRS.length);
    expect(CALL_SOUVENIRS.length).toBeGreaterThanOrEqual(50);
    expect(CALL_SOUVENIRS[0]).toBe("Maman t'a parlé de son jardin.");
    const window = [...WINDOW_LINES, ...WINDOW_LINES_HOME];
    expect(new Set(window).size).toBe(window.length);
    expect(window.length).toBeGreaterThanOrEqual(50);
  });
});

describe("Plongeur : poser les gants, les études, le livret A", () => {
  function retired(): GameState {
    const s = fresh();
    equipUpTo(s, "pro");
    poseGants(s);
    s.money = D(100000);
    return s;
  }

  it("« Poser les gants » vient avec le lave-vaisselle pro, et dit qu'il laisse du temps pour étudier", () => {
    const s = fresh();
    equipUpTo(s, "detartrer");
    expect(canPoseGants(s)).toBe(false);
    equipUpTo(s, "pro");
    expect(canPoseGants(s)).toBe(true);
    expect(poseGantsEffects(s)).toContain("Te laisse du temps pour étudier.");
  });

  it("la bibliothèque s'ouvre avec le temps libre ; les études coûtent de plus en plus cher", () => {
    const s = fresh();
    equipUpTo(s, "pro");
    expect(libraryVisible(s)).toBe(false);
    poseGants(s);
    expect(libraryVisible(s)).toBe(true);
    expect(s.flags.energyVisible).toBe(true);
    for (let i = 1; i < LIBRARY.length; i++) expect(LIBRARY[i].cost).toBeGreaterThan(LIBRARY[i - 1].cost);
    s.money = D(1000);
    expect(canBuyStudy(s, LIBRARY[1].id)).toBe(false); // dans l'ordre
    expect(buyStudy(s, "html")).toBe(true);
    s.energy = 100;
    studyStep(s, "html");
    expect(s.energy).toBe(95);
    expect(studyBuyEffects(LIBRARY[0])).toEqual(["120 pages, 5 énergie les 10 pages"]);
  });

  it("les améliorations du pro se proposent pendant les études", () => {
    const s = fresh();
    equipUpTo(s, "pro");
    const det = EQUIPMENT.find((e) => e.id === "detartrer_pro")!;
    run(s, 1);
    expect(equipmentVisible(s, det)).toBe(false);
    poseGants(s);
    s.plonge.boughtAt["gants_poses"] = s.plonge.day - 200;
    run(s, 0.1);
    expect(equipmentVisible(s, det)).toBe(true);
  });

  it("le livret A : une fois les études commencées ; dépôt, retrait ; 1 % du plus petit solde de la semaine chaque lundi", () => {
    const s = retired();
    expect(canOpenLivret(s)).toBe(false);
    s.plonge.revealed["livret"] = 0;
    expect(canOpenLivret(s)).toBe(true);
    openLivret(s);
    s.money = D(1000);
    depositLivret(s);
    expect(s.money.toNumber()).toBe(0);
    expect(s.plonge.livretBalance).toBe(1000);
    expect(vueBanque(s)!.lines).toEqual(["Livret A : 1000,00 €. Chaque lundi : ~10,00 €"]);
    expect(vueBanque(s)!.buttons.map((b) => b.lines)).toEqual([[], []]);
    s.plonge.livretLow = 1000; // resté toute la semaine
    s.plonge.day = dayStart(dayIdx(s) - (dayIdx(s) % 7) + 7) - 0.01; // la veille d'un lundi, minuit moins une
    tick(s, 0.02);
    expect(s.plonge.livretBalance).toBeCloseTo(1000 * (1 + LIVRET_RATE));
    const cash = s.money.toNumber(); // les machines ont lavé pendant ce temps
    withdrawLivret(s);
    expect(s.money.toNumber() - cash).toBeCloseTo(1010);
    expect(s.plonge.livretBalance).toBe(0);
    // Déposer le dimanche et reprendre le lundi ne rapporte rien.
    s.money = D(1000);
    s.plonge.day = dayStart(dayIdx(s) + 6) + 1;
    depositLivret(s);
    s.plonge.day = dayStart(dayIdx(s) + 1) - 0.01;
    tick(s, 0.02);
    expect(s.plonge.livretBalance).toBeCloseTo(1000);
  });

  it("« Se faire à manger » redonne de l'énergie, deux fois par jour", () => {
    const s = retired();
    s.plonge.revealed["repas"] = s.plonge.day;
    s.energy = 50;
    expect(mealVisible(s)).toBe(true);
    expect(mealEffects(s)).toEqual(["Énergie : 50 → 60", "2 repas par jour"]);
    eat(s);
    expect(s.energy).toBe(50 + MEAL_ENERGY);
    eat(s);
    expect(canEat(s)).toBe(false);
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
  });
});

describe("Plongeur : l'écran (engine/plonge/vue.ts)", () => {
  it("le jour dit midi ou soir, une fois le soir ouvert", () => {
    const s = fresh();
    s.plonge.boughtAt["montre"] = 0;
    s.plonge.day = dayStart(2) + 1;
    expect(vueJour(s)).toBe("Mercredi");
    s.plonge.boughtAt["soir"] = 0;
    expect(vueJour(s)).toBe("Mercredi midi");
    s.plonge.day = dayStart(2) + DAY_SECS / 2 + 0.1;
    expect(vueJour(s)).toBe("Mercredi soir");
    s.plonge.day = dayStart(6) + 1;
    expect(vueJour(s)).toBe("Dimanche, restaurant fermé");
  });

  it("les gants posés, l'écran compte à la minute : ce qui arrive, ce que les lave-vaisselle peuvent laver", () => {
    const s = fresh();
    equipUpTo(s, "pro");
    poseGants(s);
    s.plonge.day = dayStart(7) + 1;
    s.plonge.pile = 300;
    expect(vuePile(s)).toEqual([`Assiettes sales : ${Math.round((START_COVERS / DAY_SECS) * 60)} / minute`]);
    expect(vueLaveVaisselle(s)!.status).toBe(`Les lave-vaisselle peuvent en laver ${Math.round(machineRate(s) * 60)} / minute`);
    const det = EQUIPMENT.find((e) => e.id === "detartrer_pro")!;
    expect(equipmentEffects(s, det)[0]).toMatch(/^\d+ → \d+ assiettes \/ minute$/);
  });

  it("sur toute une partie, une fois les gants posés, jamais plus d'assiettes que les lave-vaisselle ne peuvent en laver", () => {
    for (const cps of [2, 4, 6]) {
      let worst = Infinity;
      playthrough(cps, {
        onStep: (s) => {
          if (s.manualRetired) worst = Math.min(worst, machineRate(s) - openDayArrivalRate(s));
        },
      });
      expect(worst, `${cps} clics/s`).toBeGreaterThanOrEqual(0);
    }
  });

  it("l'examen coûte 50 d'énergie par étape", () => {
    expect(LIBRARY.find((l) => l.id === "examen")!.energy).toBe(50);
  });

  it("sur toute une partie, chaque achat affiché porte un sous-titre, et aucun ne dit « A → A »", () => {
    const seen = new Set<string>();
    playthrough(4, {
      onStep: (s) => {
        const buys = [
          vueAmelioration(s)?.buy,
          ...(vueChef(s)?.offers ?? []),
          ...(vueBanque(s)?.buttons.filter((b) => b.lines.length > 0) ?? []), // déposer et reprendre : la ligne du livret suffit (choix d'Alexandre)
          vueEtudes(s)?.buy,
          ...(vueEtudes(s)?.items.map((i) => i.step) ?? []),
          vueRepas(s),
          vueAppel(s)?.answer,
          vuePoserGants(s),
          ...(vueConcessions(s)?.offers ?? []),
        ];
        for (const b of buys) {
          if (!b) continue;
          seen.add(b.label);
          expect(b.lines.length, b.label).toBeGreaterThan(0);
          for (const l of b.lines) expect(l, b.label).not.toMatch(/(\d+,\d\d €) → \1/);
        }
      },
    });
    expect(seen.size).toBeGreaterThan(25);
  });
});

describe("Plongeur : hors-ligne et rythme", () => {
  it("le hors-ligne est plafonné à 10 min et limité par l'affluence", () => {
    const s = fresh();
    equipUpTo(s, "pro");
    s.money = D(0);
    s.lastSeen = 0;
    applyOffline(s, 4 * 3600 * 1000);
    const avg = START_COVERS / DAY_SECS;
    expect(s.money.toNumber()).toBeCloseTo(avg * (6 / 7) * 0.05 * 600, 0);
  });

  it("le chapitre se termine à toutes les vitesses, sans blocage, une information à la fois", () => {
    const runs = [playthrough(2), playthrough(4), playthrough(6), playthrough(4, { afk: true }), playthrough(4, { refuse: true })];
    for (const r of runs) expect(r.secs).toBeLessThan(45 * 60);
    const [slow, mid, fast] = runs;
    expect(mid.secs).toBeGreaterThan(15 * 60);
    for (const r of [mid, fast]) expect(r.maxGap).toBeLessThan(3 * 60 + 30);
    expect(slow.maxGap).toBeLessThan(4 * 60 + 30);
    for (const r of [slow, mid, fast]) expect(r.deadMax).toBeLessThan(30.5);
  });

  it("l'offre et la capacité restent proches : ni trop souvent zéro assiette, ni trop souvent une pile qu'on ne suit pas", () => {
    for (const cps of [2, 4, 6]) {
      const r = playthrough(cps);
      expect(r.emptyShare, `pile vide à ${cps} clics/s`).toBeLessThan(0.6);
      expect(r.overflowShare, `débordement à ${cps} clics/s`).toBeLessThan(0.6);
    }
  });
});
