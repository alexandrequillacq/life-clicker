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
  PILE_VISIBLE_AT,
  FIRST_ASK_AT,
  SUNDAY_OFFER_DAY,
  LIVRET_AT,
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
  buyEquipment,
  canBuyEquipment,
  equipmentVisible,
  equipmentEffects,
  canOpenLivret,
  openLivret,
  livretEffects,
  livretLine,
  canOfferSunday,
  offerSunday,
  dayVisible,
  coversVisible,
  lifeVisible,
  callEffects,
  machineRate,
  currentAsk,
  canAskChef,
  askChef,
  askEffects,
  cycleCourtAvailable,
  setCycleCourt,
  relaunchCycle,
  shelveGreasy,
  canAnswerCall,
  answerCall,
  canLookOutWindow,
  lookOutWindow,
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
  autoIncomePerMin,
  studyBuyEffects,
} from "../src/engine/plonge";
import { poseGants } from "../src/engine/actions";
import { applyOffline } from "../src/engine/offline";

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
    if (e.revealAt !== undefined) s.plonge.day = Math.max(s.plonge.day, e.revealAt);
    s.money = s.money.add(e.cost);
    expect(buyEquipment(s, e.id)).toBe(true);
    s.plonge.boughtAt[e.id] = -1e6; // les révélations différées sont déjà passées
    if (e.id === id) return;
  }
}

/** Temps de calendrier au début du jour `d` (0 = premier lundi). */
const dayStart = (d: number): number => d * DAY_SECS;

describe("Plongeur : le restaurant (calendrier, pile finie, affluence)", () => {
  it("démarre un lundi, restaurant de 40 couverts, une petite pile qui t'attend", () => {
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
    expect(t.plonge.pile + t.plonge.overflow).toBeCloseTo(START_COVERS * 3, 0);
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

  it("au-delà de la capacité de la pile, le chef lave lui-même (perdu pour toi, jamais bloquant)", () => {
    const s = fresh();
    run(s, DAY_SECS * 3);
    expect(s.plonge.pile).toBeLessThanOrEqual(pileCap(s) + 1e-6);
    expect(pileCap(s)).toBe(PILE_BASE_CAP + START_COVERS);
    expect(s.plonge.overflow).toBeGreaterThan(0);
    expect(s.plonge.chef).toBe("debut"); // le chef ne parle pas d'une pile que tu ne vois pas encore
    run(s, DAY_SECS * 2);
    expect(s.plonge.pileVisible).toBe(true);
    expect(s.plonge.chef).toBe("debordement");
  });

  it("le compteur d'assiettes n'apparaît qu'à la première pile vide, après un moment", () => {
    const s = fresh();
    s.plonge.pile = 0;
    tick(s, 0.05);
    expect(s.plonge.pileVisible).toBe(false); // trop tôt : une information à la fois
    s.plonge.day = PILE_VISIBLE_AT;
    s.plonge.pile = 5;
    tick(s, 0.05);
    expect(s.plonge.pileVisible).toBe(false);
    s.plonge.pile = 0;
    tick(s, 0.01);
    expect(s.plonge.pileVisible).toBe(true);
  });

  it("le restaurant est fermé le dimanche au départ", () => {
    const s = fresh();
    s.plonge.day = DAY_SECS * 6 + 1; // dimanche midi
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
      for (const l of lines) expect(l.length).toBeGreaterThan(5);
      s.money = s.money.add(e.cost);
      buyEquipment(s, e.id);
    }
  });

  it("les équipements se révèlent en chaîne et ne s'achètent qu'une fois", () => {
    const s = fresh();
    expect(equipmentVisible(s, EQUIPMENT[0])).toBe(false); // au début : le bouton et l'argent, rien d'autre
    s.plonge.day = EQUIPMENT[0].revealAt!;
    expect(equipmentVisible(s, EQUIPMENT[0])).toBe(true);
    expect(equipmentVisible(s, EQUIPMENT[1])).toBe(false);
    s.money = D(10);
    expect(buyEquipment(s, "gants")).toBe(true);
    expect(s.dishesPerClick).toBe(2);
    expect(canBuyEquipment(s, "gants")).toBe(false);
    expect(equipmentVisible(s, EQUIPMENT[1])).toBe(true);
  });

  it("une tâche manuelle ne s'automatise pas : sans clic ni machine, rien ne se lave", () => {
    const s = fresh();
    s.plonge.pile = 50;
    run(s, 5);
    expect(s.money.toNumber()).toBe(0);
    expect(s.plonge.pile).toBeGreaterThan(50);
  });

  it("la montre n'arrive qu'un moment après l'éponge, et donne le jour", () => {
    const s = fresh();
    equipUpTo(s, "eponge");
    s.plonge.boughtAt["eponge"] = s.plonge.day;
    const montre = EQUIPMENT.find((e) => e.id === "montre")!;
    expect(equipmentVisible(s, montre)).toBe(false);
    s.plonge.day += montre.revealDelay!;
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
    expect(machineRate(s)).toBeCloseTo(4);
    const t = fresh();
    equipUpTo(t, "detartrer");
    expect(machineRate(t)).toBeCloseTo(4 * 1.5 ** 3);
    const u = fresh();
    equipUpTo(u, "pro");
    expect(machineRate(u)).toBeCloseTo(4 * 1.5 ** 3 + 40);
  });

  it("le revenu automatique : les machines seules, hors clic, limitées par ce que le restaurant salit", () => {
    const s = fresh();
    expect(autoIncomePerMin(s)).toBe(0);
    equipUpTo(s, "reparer");
    // 4 assiettes/s < 4,8 qui arrivent en moyenne un jour ouvert : 4 × 6/7 × 0,05 × 60.
    expect(autoIncomePerMin(s)).toBeCloseTo(4 * (6 / 7) * 0.05 * 60, 5);
    s.dishesPerClick = 100;
    s.plonge.pile = 1000;
    work(s);
    expect(autoIncomePerMin(s)).toBeCloseTo(4 * (6 / 7) * 0.05 * 60, 5); // le clic n'y entre pas
    const u = fresh();
    equipUpTo(u, "pro");
    expect(autoIncomePerMin(u)).toBeCloseTo(((START_COVERS * 3) / DAY_SECS) * (6 / 7) * 0.05 * 60, 5);
    const r = equipmentEffects(fresh(), EQUIPMENT.find((e) => e.id === "reparer")!);
    expect(r.join(" ")).toMatch(/Il te rapporte 10,29 € \/ min/);
  });

  it("l'argent est exact dès le premier clic ; le livret A arrive bien plus tard", () => {
    const s = fresh();
    expect(canOpenLivret(s)).toBe(false);
    s.plonge.day = LIVRET_AT;
    expect(canOpenLivret(s)).toBe(true);
    s.money = D(200);
    expect(livretEffects(s)).toEqual(["Chaque lundi : +5 % de ton argent", "Aujourd'hui, ce serait +10,00 €"]);
    openLivret(s);
    expect(livretLine(s)).toBe("Livret A : 5 % chaque lundi");
    // Lundi suivant : +5 %.
    s.plonge.day = dayStart(49) - 0.01;
    s.plonge.pile = 0;
    tick(s, 0.02);
    expect(s.money.toNumber()).toBeCloseTo(210, 5);
    expect(livretLine(s)).toBe("Livret A : +10,00 € lundi dernier");
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

  it("le cycle court accélère les deux machines de 30 %", () => {
    const s = fresh();
    equipUpTo(s, "joint");
    const before = machineRate(s);
    setCycleCourt(s);
    expect(machineRate(s)).toBeCloseTo(before * 1.3);
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
    run(s, DAY_SECS);
    expect(s.plonge.chef).toBe("plainte");
  });
});

describe("Plongeur : les demandes au chef (gatées par la vitesse du joueur)", () => {
  function readyToAsk(): GameState {
    const s = fresh();
    equipUpTo(s, "reparer");
    s.plonge.day = dayStart(25) + PEAK_SECS + 0.5; // après FIRST_ASK_AT, hors coup de feu
    s.plonge.emptyToday = 12;
    return s;
  }

  it("aucune demande tant que la pile n'a pas été vide 12 s dans la journée", () => {
    const s = readyToAsk();
    s.plonge.emptyToday = 11;
    expect(canAskChef(s)).toBe(false);
  });

  it("aucune demande avant la machine réparée, ni avant un bon moment", () => {
    const s = readyToAsk();
    s.plonge.day = FIRST_ASK_AT - 1;
    expect(canAskChef(s)).toBe(false);
    const t = fresh();
    t.plonge.day = dayStart(25) + PEAK_SECS + 0.5;
    t.plonge.emptyToday = 12;
    expect(canAskChef(t)).toBe(false); // pas de lave-vaisselle
  });

  it("une demande quand on va plus vite que le restaurant ; +couverts ; deux jours entre deux", () => {
    const s = readyToAsk();
    expect(coversVisible(s)).toBe(false);
    expect(canAskChef(s)).toBe(true);
    const ask = currentAsk(s)!;
    expect(askEffects(s, ask)[0]).toMatch(/40 → 55/);
    expect(askChef(s)).toBe(true);
    expect(s.plonge.covers).toBe(START_COVERS + 15);
    expect(coversVisible(s)).toBe(true);
    s.plonge.day += DAY_SECS;
    s.plonge.emptyToday = 20;
    expect(canAskChef(s)).toBe(false); // le lendemain : trop tôt
    s.plonge.day += DAY_SECS;
    expect(canAskChef(s)).toBe(true);
  });

  it("ouvrir le dimanche : une proposition unique, datée, après un appel de Maman ; le sous-titre dit le prix de vie", () => {
    const s = fresh();
    s.plonge.day = dayStart(SUNDAY_OFFER_DAY);
    expect(canOfferSunday(s)).toBe(false); // Maman n'a pas encore appelé
    s.plonge.callWeek = 2;
    expect(canOfferSunday(s)).toBe(true);
    expect(ASKS.some((a) => a.sunday)).toBe(false); // hors de la file des demandes
    offerSunday(s);
    expect(canOfferSunday(s)).toBe(false);
    s.plonge.day = dayStart(SUNDAY_OFFER_DAY + 6) + 1;
    expect(arrivalRate(s)).toBeGreaterThan(0);
  });
});

describe("Plongeur : la vie perso (Maman, la fenêtre, les souvenirs)", () => {
  /** Le 3e dimanche, jour du premier appel de Maman. */
  function sundayNoon(s: GameState): void {
    s.plonge.day = dayStart(20) - 0.01;
    tick(s, 0.05);
  }

  it("Maman n'appelle pas les deux premiers dimanches : « Ta vie » n'existe pas encore", () => {
    const s = fresh();
    s.plonge.day = dayStart(6) - 0.01;
    tick(s, 0.05);
    expect(canAnswerCall(s)).toBe(false);
    expect(lifeVisible(s)).toBe(false);
    sundayNoon(s);
    expect(canAnswerCall(s)).toBe(true);
    expect(lifeVisible(s)).toBe(true);
  });

  it("décrocher en plein service coûte des assiettes, que le chef lave à ta place", () => {
    const s = fresh();
    equipUpTo(s, "reparer");
    s.plonge.sundayOpen = true;
    s.plonge.pile = 20;
    sundayNoon(s);
    const lines = callEffects(s);
    expect(lines.join(" ")).toMatch(/Tu perds environ/);
    answerCall(s);
    const overflow = s.plonge.overflow;
    run(s, CALL_TALK_SECS);
    expect(s.plonge.overflow).toBeGreaterThan(overflow);
    expect(s.plonge.pile).toBeLessThanOrEqual(20 + 1e-6); // la pile ne monte plus pendant l'appel
  });

  it("Maman appelle le dimanche à midi ; décrocher arrête les mains 20 s et pose un souvenir", () => {
    const s = fresh();
    sundayNoon(s);
    expect(canAnswerCall(s)).toBe(true);
    s.energy = 10;
    answerCall(s);
    expect(canAnswerCall(s)).toBe(false);
    s.plonge.pile = 100;
    s.dishesPerClick = 4;
    work(s);
    expect(s.plonge.pile).toBe(100); // mains au téléphone
    run(s, CALL_TALK_SECS + 0.5);
    expect(s.souvenirs[0].missed).toBe(false);
    expect(s.souvenirs[0].kind).toBe("lien");
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
    run(s, WINDOW_IDLE_SECS - 1);
    expect(canLookOutWindow(s)).toBe(false);
    run(s, 1.5);
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

describe("Plongeur : poser les gants et la bibliothèque", () => {
  it("« Poser les gants » n'est proposé qu'avec le lave-vaisselle pro", () => {
    const s = fresh();
    equipUpTo(s, "detartrer");
    expect(canPoseGants(s)).toBe(false);
    equipUpTo(fresh(), "pro");
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
    expect(studyBuyEffects(LIBRARY[0])).toEqual(["120 pages, 10 énergie les 20 pages"]);
    expect(studyBuyEffects(LIBRARY[1])).toEqual(["8 séances, 20 énergie par séance"]);
  });

  it("l'examen ne s'ouvre qu'une fois le cours du soir terminé", () => {
    const s = fresh();
    equipUpTo(s, "pro");
    poseGants(s);
    s.money = D(10000);
    for (const id of ["html", "cours", "js", "ordi"]) buyStudy(s, id);
    expect(canBuyStudy(s, "examen")).toBe(false);
    s.plonge.library["cours"] = LIBRARY[1].steps;
    expect(canBuyStudy(s, "examen")).toBe(true);
  });

  it("l'examen réussi fait paraître l'annonce de Mme Duval, qui mène au développeur", () => {
    const s = fresh();
    equipUpTo(s, "pro");
    poseGants(s);
    s.money = D(10000);
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

  /** Joueur glouton : clique à `cps`, achète tout dès que possible, propose tout, lit dès qu'il peut. */
  function playthrough(
    cps: number,
    opts: { afk?: boolean; refuse?: boolean } = {},
  ): { secs: number; maxGap: number; reveals: [string, number][] } {
    const s = fresh();
    const dt = 0.05;
    let clickAcc = 0;
    let t = 0;
    const reveals: [string, number][] = [];
    // Ce que le joueur voit apparaître, une information à la fois.
    const seen: Record<string, () => boolean> = {
      argent: () => s.totalClicks > 0,
      ameliorations: () => equipmentVisible(s, EQUIPMENT[0]) || !!s.plonge.equipment["gants"],
      pile: () => s.plonge.pileVisible,
      montre: () => !!s.plonge.equipment["eponge"] && (equipmentVisible(s, EQUIPMENT[2]) || dayVisible(s)),
      jour: () => dayVisible(s),
      reparer: () => !!s.plonge.equipment["montre"] && (equipmentVisible(s, EQUIPMENT[3]) || s.plonge.oldRate > 0),
      machine: () => s.plonge.oldRate > 0,
      maman: () => lifeVisible(s),
      chef: () => coversVisible(s),
      cycle_court: () => !!s.plonge.equipment["joint"],
      grasses: () => s.plonge.loads >= 5,
      dimanche: () => canOfferSunday(s) || s.plonge.sundayOpen,
      maman_en_service: () => s.plonge.sundayOpen && (s.plonge.callRing > 0 || s.plonge.callTalk > 0),
      livret: () => canOpenLivret(s) || s.plonge.livret,
      gants_poses: () => s.manualRetired,
    };
    while (t < 3600 && s.job === "plongeur") {
      for (const [k, f] of Object.entries(seen)) if (!reveals.some((r) => r[0] === k) && f()) reveals.push([k, t]);
      const clicking = !(opts.afk && s.plonge.oldRate > 0);
      clickAcc += clicking ? cps * dt : 0;
      while (clickAcc >= 1) {
        work(s);
        clickAcc -= 1;
      }
      for (const e of EQUIPMENT) if (canBuyEquipment(s, e.id)) buyEquipment(s, e.id);
      if (canOpenLivret(s)) openLivret(s);
      if (canAskChef(s)) askChef(s);
      if (canOfferSunday(s)) offerSunday(s);
      if (!opts.refuse && cycleCourtAvailable(s)) setCycleCourt(s);
      if (s.plonge.greasy) shelveGreasy(s);
      if (canAnswerCall(s)) answerCall(s);
      if (canPoseGants(s)) poseGants(s);
      for (const l of LIBRARY) {
        if (canBuyStudy(s, l.id)) buyStudy(s, l.id);
        if (canStudyStep(s, l.id)) studyStep(s, l.id);
      }
      if (canAnswerAnnonce(s)) answerAnnonce(s);
      tick(s, dt);
      t += dt;
    }
    reveals.push(["annonce", t]);
    reveals.sort((a, b) => a[1] - b[1]);
    let maxGap = 0;
    for (let i = 1; i < reveals.length; i++) maxGap = Math.max(maxGap, reveals[i][1] - reveals[i - 1][1]);
    return { secs: t, maxGap, reveals };
  }

  it("le chapitre dure une vingtaine de minutes, sans blocage, une information à la fois", () => {
    const fast = playthrough(6);
    const mid = playthrough(4);
    const slow = playthrough(2);
    const afk = playthrough(4, { afk: true });
    const refuse = playthrough(4, { refuse: true });
    for (const r of [fast, mid, slow, afk, refuse]) expect(r.secs).toBeLessThan(40 * 60);
    expect(mid.secs).toBeGreaterThan(20 * 60);
    expect(mid.secs).toBeLessThan(27 * 60);
    for (const r of [fast, mid, slow]) expect(r.maxGap).toBeLessThan(3 * 60 + 15);
    // Au-delà des premières secondes (le bouton puis l'argent), jamais deux informations dans la même demi-minute.
    for (const r of [fast, mid, slow]) {
      const later = r.reveals.filter(([, t]) => t > 5);
      for (let i = 1; i < later.length; i++) expect(later[i][1] - later[i - 1][1]).toBeGreaterThan(30);
    }
    // Le compromis est rentable : le refuser rallonge, sans dépasser +20 %.
    expect(refuse.secs).toBeGreaterThan(mid.secs);
    expect(refuse.secs).toBeLessThan(mid.secs * 1.2);
  });
});
