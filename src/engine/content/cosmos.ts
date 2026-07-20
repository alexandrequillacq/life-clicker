import { D, type Decimal } from "../numbers";

// Empereur cosmique : sondes von Neumann auto-répliquantes. La progression n'a plus besoin du joueur.
// « Lancer la première sonde » est un achat unique ; ensuite le nombre de sondes croît seul (composé),
// et chaque sonde produit 1 Emprise/s. Les paliers cosmiques défilent d'eux-mêmes.
export const PROBE_COST: Decimal = D(5e10); // 50 Md€ : achat unique de la première sonde
export const PROBE_GROWTH = 0.03; // +3 %/s (croissance composée par tick, doublement ~23 s)
export const EMPRISE_PER_PROBE = 1; // Emprise/s par sonde

export interface CosmicMilestone {
  threshold: Decimal; // nombre de sondes franchi
  line: string; // ligne froide affichée une fois (jamais un toast récurrent)
}

// Une ligne froide toutes les ~4 min : la progression continue, elle n'a plus besoin du joueur.
export const COSMIC_MILESTONES: CosmicMilestone[] = [
  { threshold: D(1e3), line: "Le système solaire est couvert." },
  { threshold: D(1e6), line: "La galaxie est quadrillée." },
  { threshold: D(1e9), line: "L'amas local répond." },
  { threshold: D(1e12), line: "Le vide intergalactique aussi." },
];

/** Dernier palier cosmique franchi pour un nombre de sondes donné (ou null si aucun). */
export function cosmicMilestone(probes: Decimal): string | null {
  let line: string | null = null;
  for (const m of COSMIC_MILESTONES) {
    if (probes.gte(m.threshold)) line = m.line;
    else break;
  }
  return line;
}
