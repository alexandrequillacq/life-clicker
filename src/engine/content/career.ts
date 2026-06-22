import { D, type Decimal } from "../numbers";
import type { Job } from "../state";

export interface JobDef {
  label: string; // intitulé du métier
  clickLabel: string; // libellé de l'action active
  clickValue: Decimal; // € par action (hors multiplicateur d'upgrades)
  clickEnergyCost: number; // énergie dépensée par action (0 = aucune)
}

// L'arc : plongeur → développeur → lead dev → CTO → fondateur d'une boîte d'IA.
// Le clic du plongeur est spécial (assiettes × valeur), donc clickValue=0 ici.
export const JOBS: Record<Job, JobDef> = {
  plongeur: {
    label: "Plongeur",
    clickLabel: "Laver des assiettes",
    clickValue: D(0),
    clickEnergyCost: 0,
  },
  developpeur: {
    label: "Développeur",
    clickLabel: "Résoudre un bug",
    clickValue: D(1),
    clickEnergyCost: 5,
  },
  lead_dev: {
    label: "Lead developer",
    clickLabel: "Résoudre un bug critique",
    clickValue: D(8),
    clickEnergyCost: 5,
  },
  cto: {
    label: "CTO",
    clickLabel: "Trancher une décision technique",
    clickValue: D(50),
    clickEnergyCost: 5,
  },
  entrepreneur: {
    label: "Fondateur",
    clickLabel: "Arbitrer la roadmap",
    clickValue: D(300),
    clickEnergyCost: 6,
  },
  celebrite: {
    label: "Icône médiatique",
    clickLabel: "Publier un post",
    clickValue: D(0), // le clic donne des followers, pas de l'argent (voir work())
    clickEnergyCost: 6,
  },
  politique: {
    label: "Figure politique",
    clickLabel: "Tenir un meeting",
    clickValue: D(50000),
    clickEnergyCost: 6,
  },
};

export interface PromotionDef {
  from: Job;
  to: Job;
  cta: string; // libellé du bouton de promotion
  moneyThreshold: Decimal; // capital requis (ignoré si followersThreshold est défini)
  followersThreshold?: Decimal; // si défini, la promotion se débloque sur les followers, pas l'argent
}

export const PROMOTIONS: PromotionDef[] = [
  { from: "developpeur", to: "lead_dev", cta: "Devenir lead developer", moneyThreshold: D(150) },
  { from: "lead_dev", to: "cto", cta: "Devenir CTO", moneyThreshold: D(3000) },
  { from: "cto", to: "entrepreneur", cta: "Monter ta boîte d'IA", moneyThreshold: D(30000) },
  { from: "entrepreneur", to: "celebrite", cta: "Devenir une icône médiatique", moneyThreshold: D(8_000_000) },
  { from: "celebrite", to: "politique", cta: "Entrer en politique", moneyThreshold: D(0), followersThreshold: D(50_000_000) },
];

export function nextPromotion(job: Job): PromotionDef | null {
  return PROMOTIONS.find((p) => p.from === job) ?? null;
}
