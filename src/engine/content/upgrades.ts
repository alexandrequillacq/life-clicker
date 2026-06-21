import { D, type Decimal } from "../numbers";

export interface UpgradeDef {
  id: string;
  label: string;
  cost: Decimal;
  unlockAtMoney: Decimal; // seuil de révélation
  requires?: string; // upgrade prérequis (enchaîne la séquence)
  setDishesPerClick?: number; // fixe les assiettes/clic
  unlocksHand?: boolean; // débloque le lavage continu à la main
  setHandRate?: number; // fixe le débit continu à la main (assiettes/s)
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: "gants",
    label: "Gants de plonge",
    cost: D(0.5),
    unlockAtMoney: D(0.2),
    setDishesPerClick: 2,
  },
  {
    id: "eponge",
    label: "Meilleure éponge",
    cost: D(2),
    unlockAtMoney: D(1.5),
    requires: "gants",
    setDishesPerClick: 4,
  },
  {
    id: "coup_de_main",
    label: "Prendre le coup de main",
    cost: D(5),
    unlockAtMoney: D(4),
    requires: "eponge",
    unlocksHand: true,
    setHandRate: 10,
  },
  {
    id: "gants_pro",
    label: "Gants pro",
    cost: D(15),
    unlockAtMoney: D(12),
    requires: "coup_de_main",
    setDishesPerClick: 8,
    setHandRate: 20,
  },
];

export const UPGRADES_BY_ID: Record<string, UpgradeDef> =
  Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
