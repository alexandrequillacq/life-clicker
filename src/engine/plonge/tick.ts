import { ENERGY_MAX, type GameState } from "../state";
import {
  SUNDAY,
  LIVRET_RATE,
  LOAD_SECS,
  GREASY_EVERY,
  ENERGY_REGEN,
  CALL_RING_SECS,
  CALL_SOUVENIR,
  CALL_MISSED,
} from "../content/plonge";
import { dayIndex, arrivalRate, pileCap, openToday, pay } from "./restaurant";
import { machineRate, machineRunning } from "./equipement";
import { revealQueue, isRevealed, callStartsNow, type TickMoments } from "./revelations";
import { remember } from "./vie";

// Le temps qui passe au restaurant : le calendrier, la pile, Maman, les machines, le débordement, l'énergie.

export function tickPlonge(s: GameState, t: number): void {
  const p = s.plonge;
  const prevDay = dayIndex(s);
  p.day += t;
  const today = dayIndex(s);
  const moments: TickMoments = {};
  if (today !== prevDay) {
    p.emptyToday = 0;
    p.overflowToday = 0;
    p.mealsToday = 0;
    // La plainte arrive au service qui suit la fournée rangée grasse.
    if (p.complaint) {
      p.complaint = false;
      p.chef = "plainte";
    }
    // Maman appelle le dimanche à midi (quand, et à partir de quand : voir REVEALS).
    moments.sundayStart = today % 7 === SUNDAY;
    // Le livret A verse ses intérêts chaque lundi.
    if (today % 7 === 0 && p.livret) {
      const interest = s.money.toNumber() * LIVRET_RATE;
      s.money = s.money.add(interest);
      p.lastInterest = interest;
    }
  }

  // Le restaurant salit des assiettes ; au-delà de la place disponible, le chef lave lui-même.
  const pileBefore = p.pile;
  p.pile += arrivalRate(s) * t;

  // L'appel : il sonne, puis on parle (les mains s'arrêtent).
  if (p.callRing > 0) {
    p.callRing -= t;
    if (p.callRing <= 0) {
      p.callRing = 0;
      remember(s, "lien", CALL_MISSED, true);
    }
  }
  const talking = p.callTalk > 0;
  if (p.callTalk > 0) {
    p.callTalk -= t;
    if (p.callTalk <= 0) {
      p.callTalk = 0;
      s.energy = ENERGY_MAX; // parler à Maman recharge complètement
      remember(s, "lien", CALL_SOUVENIR, false);
    }
  }

  // Les machines lavent (elles ne se fatiguent pas).
  if (p.relaunchLeft > 0) p.relaunchLeft = Math.max(0, p.relaunchLeft - t);
  if (machineRunning(s) && machineRate(s) > 0) {
    const w = Math.min(p.pile, machineRate(s) * t);
    p.pile -= w;
    pay(s, w);
    if (p.cycleCourt && w > 0) {
      p.loadClock += t;
      if (p.loadClock >= LOAD_SECS) {
        p.loadClock -= LOAD_SECS;
        p.loads += 1;
        // Une fournée sur GREASY_EVERY ressort grasse (la première attend son tour dans la file des nouveautés).
        if (p.loads % GREASY_EVERY === 0 && p.proRate === 0) moments.greasyDue = true;
      }
    }
  }

  // Au téléphone en plein service, le chef lave à ta place ce que la machine ne suit pas.
  let lost = 0;
  if (talking && !s.manualRetired && p.pile > pileBefore) {
    lost = p.pile - pileBefore;
    p.pile = pileBefore;
  }
  const cap = pileCap(s);
  if (p.pile > cap) {
    lost += p.pile - cap;
    p.pile = cap;
  }
  if (lost > 0) {
    p.overflow += lost;
    p.overflowToday += lost;
    if (isRevealed(s, "pile") && p.overflowDay !== today) {
      p.overflowDay = today;
      if (p.chef !== "debordement") p.chefBefore = p.chef;
      p.chef = "debordement";
    }
  }
  // La réplique du débordement s'efface quand la pile redescend.
  if (p.chef === "debordement" && p.pile < pileCap(s) * 0.7) p.chef = p.chefBefore;

  // La file des nouveautés, puis ce qu'elle autorise à ce tick : l'appel de Maman, la fournée grasse.
  revealQueue(s, moments);
  if (callStartsNow(s, moments)) {
    p.callWeek = Math.floor(today / 7);
    p.callRing = CALL_RING_SECS;
    if (p.sundayOpen && !s.manualRetired && !p.serviceCall) {
      p.serviceCall = true;
      p.boughtAt["service_call"] = p.day;
    }
  }
  if (moments.greasyDue && isRevealed(s, "grasses")) p.greasy = true;

  // Énergie : le repos continu (elle ne se dépense qu'en études).
  s.energy = Math.min(ENERGY_MAX, s.energy + ENERGY_REGEN * t);

  // Tu suis le restaurant : la pile est vide un jour ouvert.
  if (openToday(s) && p.pile < Math.max(1, s.dishesPerClick)) p.emptyToday += t;
  p.emptyFor = p.pile < 1 ? p.emptyFor + t : 0;

  // Inactivité (la fenêtre) : le téléphone ne compte pas comme du temps libre.
  if (p.callTalk <= 0) p.idle += t;
}
