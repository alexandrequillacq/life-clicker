import { ENERGY_MAX, type GameState } from "../state";
import {
  SUNDAY,
  LOAD_SECS,
  GREASY_EVERY,
  RELAUNCH_SECS,
  BEHIND_LOADS,
  ENERGY_REGEN,
  CALL_SOUVENIR,
  CALL_MISSED,
  PILE_WARN_SHARE,
} from "../content/plonge";
import { dayIndex, dayName, arrivalRate, pileCap, openToday, pay, secsLeftToday } from "./restaurant";
import { oldMachineRate, machineOutput, greasyLoads, loadUnit } from "./equipement";
import { payInterest, askReady } from "./chef";
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
    p.behindToday = 0;
    p.overflowToday = 0;
    p.mealsToday = 0;
    // Maman appelle le dimanche (quand, et à partir de quand : voir REVEALS).
    moments.sundayStart = today % 7 === SUNDAY;
    // Le livret A verse ses intérêts chaque lundi.
    if (today % 7 === 0) payInterest(s);
  }
  p.livretLow = Math.min(p.livretLow, p.livretBalance);

  // Le restaurant salit des assiettes ; au-delà de la place disponible, le chef lave lui-même.
  const pileBefore = p.pile;
  p.pile += arrivalRate(s) * t;

  // L'appel : il sonne tout le dimanche, puis on parle jusqu'à lundi (les mains s'arrêtent).
  if (p.callRing > 0) {
    p.callRing -= t;
    if (p.callRing <= 0) {
      p.callRing = 0;
      remember(s, "lien", CALL_MISSED, true, p.callDay);
    }
  }
  const talking = p.callTalk > 0;
  if (p.callTalk > 0) {
    p.callTalk -= t;
    if (p.callTalk <= 0) {
      p.callTalk = 0;
      s.energy = ENERGY_MAX; // parler à Maman recharge complètement
      remember(s, "lien", CALL_SOUVENIR, false, p.callDay);
    }
  }

  // Les machines lavent (elles ne se fatiguent pas, et le téléphone ne les arrête pas).
  const oldWorking = p.relaunchLeft <= 0 && oldMachineRate(s) > 0;
  if (p.relaunchLeft > 0) p.relaunchLeft = Math.max(0, p.relaunchLeft - t);
  const rate = machineOutput(s);
  if (rate > 0) {
    const w = Math.min(p.pile, rate * t);
    p.pile -= w;
    pay(s, w);
    // En cycle court, les fournées du vieux se comptent : une sur GREASY_EVERY ressort grasse.
    if (greasyLoads(s) && oldWorking && w > 0) {
      p.loadClock += t;
      if (p.loadClock >= LOAD_SECS) {
        p.loadClock -= LOAD_SECS;
        p.loads += 1;
        if (p.loads % GREASY_EVERY === 0) moments.greasyDue = true;
      }
    }
  }

  // Au téléphone en plein service, le chef lave à ta place ce que les machines ne suivent pas.
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
  if (p.chef === "debordement" && p.pile < pileCap(s) * PILE_WARN_SHARE) p.chef = p.chefBefore;
  // La plainte arrive au service qui suit la fournée partie grasse (elle passe avant le débordement).
  if (today !== prevDay && p.complaint) {
    p.complaint = false;
    p.chef = "plainte";
  }

  // La file des nouveautés, puis ce qu'elle autorise à ce tick : l'appel de Maman, la fournée grasse.
  revealQueue(s, moments);
  if (callStartsNow(s, moments)) {
    p.callWeek = Math.floor(today / 7);
    p.callRing = secsLeftToday(s);
    p.callDay = dayName(s);
    p.rings += 1;
    p.boughtAt[`sonnerie_${p.rings}`] = p.day;
    if (p.sundayOpen && !s.manualRetired && !p.serviceCall) {
      p.serviceCall = true;
      p.boughtAt["service_call"] = p.day;
    }
  }
  if (moments.greasyDue && isRevealed(s, "grasses")) {
    if (p.concessions["sans_relavage"]) p.complaint = true; // elle part en salle comme elle est
    else p.relaunchLeft = RELAUNCH_SECS; // le vieux la relave tout seul
  }

  // Énergie : le repos continu (elle ne se dépense qu'en études).
  s.energy = Math.min(ENERGY_MAX, s.energy + ENERGY_REGEN * t);

  // Tu suis le restaurant (ou non) : ce qui reste sale, en brassées, un jour ouvert.
  if (openToday(s)) {
    const unit = loadUnit(s);
    if (p.pile < unit && !p.askShown) p.keptUp += t; // figé tant qu'une demande attend ton clic
    if (p.pile >= BEHIND_LOADS * unit) p.behindToday += t;
  }
  p.emptyFor = p.pile < 1 ? p.emptyFor + t : 0;
  // La demande suivante au chef se propose (et reste jusqu'au clic).
  if (!p.askShown && askReady(s)) p.askShown = true;

  // Inactivité (la fenêtre) : le téléphone ne compte pas comme du temps libre.
  if (p.callTalk <= 0) p.idle += t;
}
