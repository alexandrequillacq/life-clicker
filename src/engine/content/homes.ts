import { D, type Decimal } from "../numbers";

export interface HomeDef {
  label: string; // nom du lieu de vie (affiché dans la barre de fenêtre)
  cta: string; // bouton pour l'acquérir (vide pour le niveau de départ)
  cost: Decimal; // coût d'accès
  unlockAtMoney: Decimal; // seuil de révélation de l'achat
}

// Le cadre de vie du joueur, du sous-sol miteux (début dev) à la villa. Il n'orne plus un décor
// de fond : il EMBELLIT l'interface elle-même. Chaque niveau donne à l'écran plus de lumière,
// de matière et de calme (l'UI est dessinée dans App.svelte, par data-home). Acheter un meilleur
// logement n'est PAS automatiser sa vie : ce sont les fruits honnêtes de la réussite.
export const HOMES: HomeDef[] = [
  { label: "Sous-sol", cta: "", cost: D(0), unlockAtMoney: D(0) },
  { label: "Premier logement", cta: "Quitter le sous-sol", cost: D(2000), unlockAtMoney: D(1200) },
  { label: "Appartement lumineux", cta: "Louer un appartement lumineux", cost: D(50000), unlockAtMoney: D(30000) },
  { label: "Loft", cta: "S'installer dans un loft", cost: D(1_000_000), unlockAtMoney: D(600000) },
  { label: "Maison avec jardin", cta: "S'offrir une maison avec jardin", cost: D(20_000_000), unlockAtMoney: D(12_000_000) },
  { label: "Villa avec piscine", cta: "Faire construire une villa avec piscine", cost: D(500_000_000), unlockAtMoney: D(300_000_000) },
];

export function currentHome(homeLevel: number): HomeDef {
  return HOMES[Math.min(homeLevel, HOMES.length - 1)];
}

export function nextHome(homeLevel: number): HomeDef | null {
  return HOMES[homeLevel + 1] ?? null;
}
