import { D, type Decimal } from "../numbers";

export interface HomeDef {
  label: string; // nom du lieu de vie (affiché)
  cta: string; // bouton pour l'acquérir (vide pour le niveau de départ)
  cost: Decimal; // coût d'accès
  unlockAtMoney: Decimal; // seuil de révélation de l'achat
  bg: string; // valeur CSS de background-image
}

// Le décor de fond = le lieu de vie du joueur, du sous-sol miteux (début dev) à la villa.
// Acheter un meilleur logement n'est PAS automatiser sa vie : ce sont les fruits honnêtes de la réussite.
// Les dégradés sont des placeholders ; pour une vraie photo, remplacer bg par
// "url('/life-clicker/homes/0.jpg')" etc. (déposer les images dans public/homes/).
export const HOMES: HomeDef[] = [
  { label: "Sous-sol", cta: "", cost: D(0), unlockAtMoney: D(0), bg: "linear-gradient(160deg, #3a3d42, #17191c)" },
  { label: "Premier logement", cta: "Quitter le sous-sol", cost: D(2000), unlockAtMoney: D(1200), bg: "linear-gradient(160deg, #5a6470, #2c3540)" },
  { label: "Appartement clair", cta: "Louer un appartement clair", cost: D(50000), unlockAtMoney: D(30000), bg: "linear-gradient(160deg, #8693a8, #41506a)" },
  { label: "Loft", cta: "Acheter un loft", cost: D(1_000_000), unlockAtMoney: D(600000), bg: "linear-gradient(160deg, #a8977f, #4f4536)" },
  { label: "Maison avec jardin", cta: "S'offrir une maison avec jardin", cost: D(20_000_000), unlockAtMoney: D(12_000_000), bg: "linear-gradient(160deg, #cdb27f, #6f5838)" },
  { label: "Villa avec piscine", cta: "Faire construire une villa avec piscine", cost: D(500_000_000), unlockAtMoney: D(300_000_000), bg: "linear-gradient(160deg, #93d6f0, #2f7fd0)" },
];

export function currentHome(homeLevel: number): HomeDef {
  return HOMES[Math.min(homeLevel, HOMES.length - 1)];
}

export function nextHome(homeLevel: number): HomeDef | null {
  return HOMES[homeLevel + 1] ?? null;
}
