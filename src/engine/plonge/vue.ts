import { ENERGY_MAX, type GameState } from "../state";
import {
  EQUIPMENT,
  LIBRARY,
  CHEF_LINES,
  SUNDAY_OFFER,
  AGE_PLONGEUR,
  RELAUNCH_SECS,
  PILE_WARN_SHARE,
  TEXTES,
} from "../content/plonge";
import { fmtEuros, fmtRate, onThePhone } from "./commun";
import { dayName, isPeak, openToday, pileCap, noDirtyPlates, washClick } from "./restaurant";
import { isRevealed, dayVisible, coversVisible, lifeVisible } from "./revelations";
import {
  machineRate,
  autoIncomeLine,
  equipmentVisible,
  canBuyEquipment,
  buyEquipment,
  equipmentEffects,
  cycleCourtAvailable,
  cycleCourtEffects,
  setCycleCourt,
  relaunchCycle,
  shelveGreasy,
} from "./equipement";
import {
  chefVisible,
  currentAsk,
  canAskChef,
  askChef,
  askEffects,
  askStatus,
  canOfferSunday,
  offerSunday,
  canOpenLivret,
  openLivret,
  livretEffects,
  livretLine,
} from "./chef";
import { canAnswerCall, answerCall, callEffects, canLookOutWindow, lookOutWindow, mealVisible, canEat, eat, mealEffects } from "./vie";
import {
  canPoseGants,
  retireHands,
  poseGantsEffects,
  libraryVisible,
  studyBuyVisible,
  canBuyStudy,
  buyStudy,
  studyBuyEffects,
  canStudyStep,
  studyStep,
  studyStepLabel,
  studyStepEffects,
  studyProgress,
  studyDone,
  canAnswerAnnonce,
  answerAnnonce,
} from "./etudes";

// Ce que l'écran du plongeur affiche, bloc par bloc. Chaque fonction rend null quand son bloc est caché,
// sinon tout ce qu'il faut pour l'afficher (libellés, sous-titres chiffrés, bouton grisé ou non, action).
// Plonge.svelte ne fait que mettre ces blocs en page.

/** Un bouton et ses sous-titres. */
export interface Bouton {
  label: string;
  price?: string;
  lines: string[];
  disabled: boolean;
  act: () => void;
}
const bouton = (label: string, lines: string[], act: () => void, disabled = false, price?: string): Bouton => ({
  label,
  lines,
  act,
  disabled,
  price,
});

// --- En tête ---

export interface VueEntete {
  chef: string;
  money: string | null;
  auto: string | null;
  livret: string | null;
}
export function vueEntete(s: GameState): VueEntete {
  return {
    chef: CHEF_LINES[s.plonge.chef],
    money: s.flags.moneyVisible ? TEXTES.money(fmtEuros(s.money.toNumber())) : null,
    auto: isRevealed(s, "machine") ? autoIncomeLine(s) : null,
    livret: s.plonge.livret ? livretLine(s) : null,
  };
}

/** Au téléphone avec Maman, tout s'arrête : chaque bouton est grisé le temps de l'appel. */
export function vueTelephone(s: GameState): boolean {
  return onThePhone(s);
}

// --- Travail ---

export function vueJour(s: GameState): string | null {
  if (!dayVisible(s)) return null;
  const day = dayName(s);
  return !openToday(s) ? TEXTES.dayClosed(day) : isPeak(s) ? TEXTES.dayPeak(day) : day;
}

export function vuePile(s: GameState): string[] | null {
  if (!isRevealed(s, "pile")) return null;
  const p = s.plonge;
  const out = [TEXTES.pile(Math.floor(p.pile))];
  if (p.pile > pileCap(s) * PILE_WARN_SHARE) out.push(TEXTES.pileWarn(pileCap(s)));
  if (p.overflowToday >= 1) out.push(TEXTES.overflowToday(Math.floor(p.overflowToday)));
  return out;
}

export function vueCouverts(s: GameState): string | null {
  return coversVisible(s) ? TEXTES.covers(s.plonge.covers) : null;
}

/** Le bouton « Laver » : libellé stable (il suit l'équipement, pas la pile, sinon il clignote quand on clique vite). */
export function vueLaver(s: GameState): Bouton | null {
  if (s.manualRetired) return null;
  const phone = onThePhone(s);
  const empty = noDirtyPlates(s);
  const label = phone ? TEXTES.washPhone : empty ? TEXTES.washEmpty : TEXTES.wash(s.dishesPerClick);
  return bouton(label, [], () => washClick(s), empty || phone);
}

export interface VueLaveVaisselle {
  title: string;
  status: string; // débit, fournée grasse ou relavage en cours
  greasy: { relaunch: Bouton; shelve: Bouton; note: string } | null;
  cycleCourt: Bouton | null;
}
export function vueLaveVaisselle(s: GameState): VueLaveVaisselle | null {
  if (!isRevealed(s, "machine")) return null;
  const p = s.plonge;
  const status = p.greasy
    ? TEXTES.greasy
    : p.relaunchLeft > 0
      ? TEXTES.relaunching(Math.ceil(p.relaunchLeft))
      : TEXTES.machineRate(fmtRate(machineRate(s)));
  return {
    title: TEXTES.machineTitle,
    status,
    greasy: p.greasy
      ? {
          relaunch: bouton(TEXTES.relaunch, [], () => relaunchCycle(s)),
          shelve: bouton(TEXTES.shelve, [], () => shelveGreasy(s)),
          note: TEXTES.greasyChoice(RELAUNCH_SECS),
        }
      : null,
    cycleCourt: cycleCourtAvailable(s)
      ? bouton(TEXTES.cycleCourtCta, cycleCourtEffects(s), () => setCycleCourt(s), false, TEXTES.free)
      : null,
  };
}

/** Le prochain équipement proposé (un seul à la fois). */
export function vueAmelioration(s: GameState): { title: string; buy: Bouton } | null {
  const def = EQUIPMENT.find((e) => equipmentVisible(s, e));
  if (!def) return null;
  return {
    title: TEXTES.upgradesTitle,
    buy: bouton(def.cta, equipmentEffects(s, def), () => buyEquipment(s, def.id), !canBuyEquipment(s, def.id), fmtEuros(def.cost)),
  };
}

export function vueChef(s: GameState): { title: string; offers: Bouton[] } | null {
  const offers: Bouton[] = [];
  if (canOfferSunday(s)) offers.push(bouton(SUNDAY_OFFER.cta, askEffects(s, SUNDAY_OFFER), () => offerSunday(s)));
  const ask = chefVisible(s) ? currentAsk(s) : null;
  if (ask) {
    const ok = canAskChef(s);
    offers.push(bouton(ask.cta, [...askEffects(s, ask), ...(ok ? [] : askStatus(s))], () => askChef(s), !ok));
  }
  return offers.length > 0 ? { title: TEXTES.chefTitle, offers } : null;
}

export function vueBanque(s: GameState): { title: string; buy: Bouton } | null {
  if (!canOpenLivret(s)) return null;
  return { title: TEXTES.bankTitle, buy: bouton(TEXTES.livretCta, livretEffects(s), () => openLivret(s), false, TEXTES.free) };
}

export function vuePoserGants(s: GameState): Bouton | null {
  if (!canPoseGants(s)) return null;
  return bouton(TEXTES.poseGantsCta, poseGantsEffects(s), () => retireHands(s));
}

export function vueAnnonce(s: GameState): { text: string; buy: Bouton } | null {
  if (!canAnswerAnnonce(s)) return null;
  return { text: TEXTES.annonceText, buy: bouton(TEXTES.annonceCta, TEXTES.annonceEffects, () => answerAnnonce(s)) };
}

// --- Ta vie ---

export interface VueVie {
  title: string;
  age: string;
  energy: string | null;
}
/** La colonne « Ta vie » (null tant qu'elle n'est pas née : l'écran n'a alors qu'une colonne). */
export function vueVie(s: GameState): VueVie | null {
  if (!lifeVisible(s)) return null;
  return {
    title: TEXTES.colLife,
    age: TEXTES.age(AGE_PLONGEUR),
    energy: s.flags.energyVisible ? TEXTES.energy(Math.round(s.energy), ENERGY_MAX) : null,
  };
}
/** Le titre de la colonne « Travail » n'a de sens qu'à côté de « Ta vie ». */
export function vueTitreTravail(s: GameState): string | null {
  return lifeVisible(s) ? TEXTES.colWork : null;
}

export function vueAppel(s: GameState): { text: string; answer: Bouton | null; lines: string[] } | null {
  if (canAnswerCall(s)) return { text: TEXTES.callRinging, answer: bouton(TEXTES.callAnswer, callEffects(s), () => answerCall(s)), lines: [] };
  if (onThePhone(s)) return { text: TEXTES.onPhone, answer: null, lines: [TEXTES.onPhoneLeft(Math.ceil(s.plonge.callTalk))] };
  return null;
}

export function vueRepas(s: GameState): Bouton | null {
  if (!mealVisible(s)) return null;
  return bouton(TEXTES.mealCta, mealEffects(s), () => eat(s), !canEat(s));
}

export interface VueEtude {
  id: string;
  name: string;
  done: string | null; // la ligne de fin, une fois l'étude terminée
  progress: { share: number; text: string } | null;
  step: Bouton | null;
}
export function vueEtudes(s: GameState): { title: string; items: VueEtude[]; buy: Bouton | null } | null {
  if (!libraryVisible(s)) return null;
  const items = LIBRARY.filter((l) => l.id in s.plonge.library).map((item): VueEtude => {
    const finished = studyDone(s, item.id);
    const prog = studyProgress(s, item);
    return {
      id: item.id,
      name: item.name,
      done: finished ? item.done : null,
      progress: finished ? null : { share: prog.done / prog.total, text: TEXTES.studyProgress(prog.done, prog.total, item.unit) },
      step: finished
        ? null
        : bouton(studyStepLabel(s, item), studyStepEffects(s, item), () => studyStep(s, item.id), !canStudyStep(s, item.id)),
    };
  });
  const next = LIBRARY.find((l) => studyBuyVisible(s, l.id));
  const buy = next
    ? bouton(next.cta, studyBuyEffects(next), () => buyStudy(s, next.id), !canBuyStudy(s, next.id), fmtEuros(next.cost))
    : null;
  return { title: TEXTES.studiesTitle, items, buy };
}

/** Avant les études : une ligne grise qui les annonce. */
export function vueTeaserEtudes(s: GameState): string | null {
  return !libraryVisible(s) && isRevealed(s, "teaser") ? TEXTES.studyTeaser : null;
}

export function vueFenetre(s: GameState): Bouton | null {
  return canLookOutWindow(s) ? bouton(TEXTES.windowCta, [], () => lookOutWindow(s)) : null;
}

export function vueSouvenirs(s: GameState): { title: string; items: { text: string; missed: boolean }[] } | null {
  if (s.souvenirs.length === 0) return null;
  return {
    title: TEXTES.souvenirsTitle,
    items: s.souvenirs.slice(0, 5).map((m) => ({ text: TEXTES.souvenir(m.day, m.text), missed: m.missed })),
  };
}
