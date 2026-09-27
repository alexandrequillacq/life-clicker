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
  HAND_UNLOCK_PLATES,
  BANK_UNLOCK_EARNED,
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
  canOpenBank,
  openBank,
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
  gainsPerMinute,
  pocketLabel,
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

/** Donne tout l'équipement jusqu'à (inclus) l'id demandé, sans passer par la caisse. */
function equipUpTo(s: GameState, id: string): void {
  for (const e of EQUIPMENT) {
    s.money = s.money.add(e.cost);
    expect(buyEquipment(s, e.id)).toBe(true);
    if (e.id === id) return;
  }
}

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
    expect(s.plonge.chef).toBe("debordement");
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
    expect(equipmentVisible(s, EQUIPMENT[0])).toBe(true);
    expect(equipmentVisible(s, EQUIPMENT[1])).toBe(false);
    s.money = D(10);
    expect(buyEquipment(s, "gants")).toBe(true);
    expect(s.dishesPerClick).toBe(2);
    expect(canBuyEquipment(s, "gants")).toBe(false);
    expect(equipmentVisible(s, EQUIPMENT[1])).toBe(true);
  });

  it("le coup de main vient avec l'habitude (300 assiettes lavées), il ne s'achète pas", () => {
    const s = fresh();
    s.plonge.washed = HAND_UNLOCK_PLATES - 1;
    tick(s, 0.01);
    expect(s.handWashing).toBe(false);
    s.plonge.washed = HAND_UNLOCK_PLATES;
    tick(s, 0.01);
    expect(s.handWashing).toBe(true);
    expect(s.flags.energyVisible).toBe(true);
  });

  it("la fatigue ne touche que les mains : de meilleurs gants fatiguent moins", () => {
    const s = fresh();
    s.handWashing = true;
    s.handRate = 10;
    s.plonge.pile = 1e6; // toujours du travail
    s.flags.energyVisible = true;
    run(s, 120);
    const tired = s.energy; // palier soutenable avec les gants de base
    expect(tired).toBeGreaterThan(0);
    expect(tired).toBeLessThan(100);
    const t = fresh();
    equipUpTo(t, "gants_pro");
    t.handWashing = true;
    t.handRate = 10;
    t.plonge.pile = 1e6;
    t.flags.energyVisible = true;
    run(t, 120);
    expect(t.energy).toBeGreaterThan(tired);
  });

  it("joint, panier et détartrage n'améliorent que la vieille machine ; le pro compte à part", () => {
    const s = fresh();
    equipUpTo(s, "reparer");
    expect(machineRate(s)).toBeCloseTo(6);
    equipUpTo(fresh(), "joint");
    const t = fresh();
    equipUpTo(t, "detartrer");
    expect(machineRate(t)).toBeCloseTo(6 * 1.5 ** 3);
    const u = fresh();
    equipUpTo(u, "pro");
    expect(machineRate(u)).toBeCloseTo(6 * 1.5 ** 3 + 40);
  });

  it("la montre affiche les gains réels des 60 dernières secondes, clic compris", () => {
    const s = fresh();
    s.plonge.pile = 1000;
    s.dishesPerClick = 10;
    for (let i = 0; i < 20; i++) work(s);
    tick(s, 1);
    expect(gainsPerMinute(s)).toBeCloseTo(20 * 10 * 0.05, 1);
  });

  it("avant la banque, l'argent se dit en pièces ; le compte affiche le montant exact", () => {
    const s = fresh();
    s.money = D(0.4);
    expect(pocketLabel(s)).toMatch(/pièce/);
    expect(canOpenBank(s)).toBe(false);
    s.plonge.earned = BANK_UNLOCK_EARNED;
    expect(canOpenBank(s)).toBe(true);
    openBank(s);
    expect(s.plonge.bank).toBe(true);
    expect(canOpenBank(s)).toBe(false);
  });
});

describe("Plongeur : le cycle court et les assiettes grasses", () => {
  function withCycleCourt(): GameState {
    const s = fresh();
    equipUpTo(s, "joint");
    expect(cycleCourtAvailable(s)).toBe(true);
    setCycleCourt(s);
    s.plonge.pile = 1e6;
    s.plonge.handUnlocked = true; // on isole les machines : les mains restent au repos
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
    s.handWashing = false;
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
  it("aucune demande tant que la pile n'a pas été vide 12 s dans la journée", () => {
    const s = fresh();
    expect(canAskChef(s)).toBe(false);
    run(s, 10);
    expect(canAskChef(s)).toBe(false);
  });

  it("une demande quand on va plus vite que le restaurant ; +couverts ; une par jour", () => {
    const s = fresh();
    s.plonge.day = PEAK_SECS + 0.5; // hors coup de feu
    s.plonge.emptyToday = 12;
    expect(canAskChef(s)).toBe(true);
    const ask = currentAsk(s)!;
    expect(askEffects(s, ask)[0]).toMatch(/40 → 55/);
    expect(askChef(s)).toBe(true);
    expect(s.plonge.covers).toBe(START_COVERS + 15);
    s.plonge.emptyToday = 20;
    expect(canAskChef(s)).toBe(false); // une par jour
  });

  it("ouvrir le dimanche : le sous-titre dit le prix de vie", () => {
    const s = fresh();
    s.plonge.asksDone = ASKS.findIndex((a) => a.sunday);
    const ask = currentAsk(s)!;
    const lines = askEffects(s, ask);
    expect(lines.join(" ")).toMatch(/6 → 7/);
    expect(lines.join(" ")).toMatch(/Tu travailles le dimanche/);
    s.plonge.emptyToday = 12;
    askChef(s);
    s.plonge.day = DAY_SECS * 6 + 1;
    expect(arrivalRate(s)).toBeGreaterThan(0);
  });
});

describe("Plongeur : la vie perso (Maman, la fenêtre, les souvenirs)", () => {
  function sundayNoon(s: GameState): void {
    s.plonge.day = DAY_SECS * 6 - 0.01;
    tick(s, 0.05);
  }

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

  it("« Regarder par la fenêtre » : après 20 s sans rien faire, une fois par jour", () => {
    const s = fresh();
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
    poseGants(s);
    expect(libraryVisible(s)).toBe(true);
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
  function playthrough(cps: number, opts: { afk?: boolean; refuse?: boolean } = {}): { secs: number; maxGap: number } {
    const s = fresh();
    const dt = 0.05;
    let clickAcc = 0;
    let t = 0;
    let lastNovelty = 0;
    let maxGap = 0;
    const novelty = () => {
      maxGap = Math.max(maxGap, t - lastNovelty);
      lastNovelty = t;
    };
    while (t < 3600 && s.job === "plongeur") {
      const clicking = !(opts.afk && s.handWashing);
      clickAcc += clicking ? cps * dt : 0;
      while (clickAcc >= 1) {
        work(s);
        clickAcc -= 1;
      }
      for (const e of EQUIPMENT) if (canBuyEquipment(s, e.id) && buyEquipment(s, e.id)) novelty();
      if (canOpenBank(s)) {
        openBank(s);
        novelty();
      }
      if (canAskChef(s) && askChef(s)) novelty();
      if (!opts.refuse && cycleCourtAvailable(s)) setCycleCourt(s);
      if (s.plonge.greasy) shelveGreasy(s);
      if (canAnswerCall(s)) answerCall(s);
      if (canPoseGants(s)) {
        poseGants(s);
        novelty();
      }
      for (const l of LIBRARY) {
        if (canBuyStudy(s, l.id) && buyStudy(s, l.id)) novelty();
        if (canStudyStep(s, l.id)) studyStep(s, l.id);
      }
      if (canAnswerAnnonce(s)) {
        answerAnnonce(s);
        novelty();
      }
      tick(s, dt);
      t += dt;
    }
    return { secs: t, maxGap };
  }

  it("le chapitre se boucle sans blocage, du cliqueur rapide au joueur passif", () => {
    const fast = playthrough(6);
    const mid = playthrough(4);
    const slow = playthrough(2);
    const afk = playthrough(4, { afk: true });
    const refuse = playthrough(4, { refuse: true });
    for (const r of [fast, mid, slow, afk, refuse]) expect(r.secs).toBeLessThan(25 * 60);
    expect(mid.secs).toBeGreaterThan(5 * 60);
    expect(mid.secs).toBeLessThan(16 * 60);
    // Le compromis est rentable : le refuser rallonge, sans dépasser +20 %.
    expect(refuse.secs).toBeGreaterThan(mid.secs);
    expect(refuse.secs).toBeLessThan(mid.secs * 1.2);
  });
});
