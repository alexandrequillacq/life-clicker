import { D, type Decimal } from "../numbers";

// Damiers de contrôle (Acte III) : cibles UNIQUES achetées en €, qui rapportent des €/s ET de l'Emprise/s.
// La banque centrale imprime, les médias captés monétisent : la conquête s'autofinance (correctif central
// du challenge, sinon le damier était inachetable avec un revenu € gelé depuis l'Acte II). Elles restent
// acquises aux métiers suivants (un empereur garde ses continents) : une fois posées, elles produisent
// pour toujours, quel que soit le métier courant.

// La Résistance : le contrôle appelle la contestation, la contestation appelle plus de contrôle.
// Purement mécanique, jamais commenté.
export const RESISTANCE_RATE_PRESIDENT = 1; // +1/s dès que 2 institutions sont contrôlées
export const RESISTANCE_RATE_MONDE = 1.5; // +1,5/s dès qu'au moins 1 continent est annexé
export const RESISTANCE_FACTOR_DIV = 150; // l'Emprise/s est multipliée par (1 − resistance/150) : plancher 1/3
export const RESISTANCE_REPRESSION_RATE = 2; // chaque cible de répression possédée : −2/s sur la jauge

export interface ControlTargetDef {
  id: string;
  label: string;
  cost: Decimal; // coût € one-shot
  moneyPerSec: Decimal; // €/s ajoutés au revenu passif (persiste après promotion)
  emprisePerSec: Decimal; // Emprise/s ajoutés (amplifiée par les GPU, drainée par la Résistance)
  repression: boolean; // possédée, cette cible fait −2/s sur la Résistance
  job: "president" | "monde"; // damier auquel appartient la cible
  unlockAtMoney: Decimal; // seuil de révélation progressive (~70 % du coût)
}

export const CONTROLS: ControlTargetDef[] = [
  // Damier des institutions (président).
  {
    id: "medias",
    label: "Contrôler les médias nationaux",
    cost: D(2e6),
    moneyPerSec: D(1e5),
    emprisePerSec: D(1e3),
    repression: true,
    job: "president",
    unlockAtMoney: D(1.4e6),
  },
  {
    id: "parlement",
    label: "Soumettre le parlement",
    cost: D(1e7),
    moneyPerSec: D(3e5),
    emprisePerSec: D(3e3),
    repression: false,
    job: "president",
    unlockAtMoney: D(7e6),
  },
  {
    id: "banque",
    label: "Capturer la banque centrale",
    cost: D(4e7),
    moneyPerSec: D(8e5),
    emprisePerSec: D(6e3),
    repression: false,
    job: "president",
    unlockAtMoney: D(2.8e7),
  },
  {
    id: "armee",
    label: "S'attacher l'armée",
    cost: D(1.2e8),
    moneyPerSec: D(2e6),
    emprisePerSec: D(1.2e4),
    repression: false,
    job: "president",
    unlockAtMoney: D(8.4e7),
  },
  {
    id: "population",
    label: "Surveiller la population",
    cost: D(3e8),
    moneyPerSec: D(4e6),
    emprisePerSec: D(2.5e4),
    repression: true,
    job: "president",
    unlockAtMoney: D(2.1e8),
  },
  // Damier des continents (maître du monde).
  {
    id: "europe",
    label: "Annexer l'Europe",
    cost: D(8e8),
    moneyPerSec: D(8e6),
    emprisePerSec: D(3e5),
    repression: false,
    job: "monde",
    unlockAtMoney: D(5.6e8),
  },
  {
    id: "ameriques",
    label: "Annexer les Amériques",
    cost: D(2e9),
    moneyPerSec: D(2e7),
    emprisePerSec: D(8e5),
    repression: false,
    job: "monde",
    unlockAtMoney: D(1.4e9),
  },
  {
    id: "afrique",
    label: "Annexer l'Afrique",
    cost: D(5e9),
    moneyPerSec: D(5e7),
    emprisePerSec: D(1.5e6),
    repression: false,
    job: "monde",
    unlockAtMoney: D(3.5e9),
  },
  {
    id: "asie",
    label: "Annexer l'Asie",
    cost: D(1.2e10),
    moneyPerSec: D(1.2e8),
    emprisePerSec: D(3e6),
    repression: false,
    job: "monde",
    unlockAtMoney: D(8.4e9),
  },
  {
    id: "drones",
    label: "Déployer les essaims de drones",
    cost: D(2.5e10),
    moneyPerSec: D(0),
    emprisePerSec: D(6e6),
    repression: true,
    job: "monde",
    unlockAtMoney: D(1.75e10),
  },
  {
    id: "surveillance_totale",
    label: "Étendre la surveillance totale",
    cost: D(5e10),
    moneyPerSec: D(2.5e8),
    emprisePerSec: D(1e7),
    repression: true,
    job: "monde",
    unlockAtMoney: D(3.5e10),
  },
];

export const CONTROLS_BY_ID: Record<string, ControlTargetDef> =
  Object.fromEntries(CONTROLS.map((c) => [c.id, c]));

/** Nombre de cibles possédées pour un damier donné (institutions président ou continents monde). */
export function controlsOwnedForJob(controls: Record<string, boolean>, job: "president" | "monde"): number {
  return CONTROLS.reduce((n, c) => n + (c.job === job && controls[c.id] ? 1 : 0), 0);
}

/** Nombre de cibles de répression possédées (tous damiers confondus : l'appareil de répression persiste). */
export function repressionOwned(controls: Record<string, boolean>): number {
  return CONTROLS.reduce((n, c) => n + (c.repression && controls[c.id] ? 1 : 0), 0);
}
