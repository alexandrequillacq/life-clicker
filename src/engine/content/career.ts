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
  freelance: {
    label: "Développeur freelance",
    clickLabel: "Écrire du code",
    clickValue: D(0), // le chapitre 2 a son propre moteur (engine/freelance)
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
    // « Trancher une décision technique » n'est plus un clic : c'est le titre de la mécanique
    // de cartes de décision (voir content/decisions.ts). Le CTO ne gagne rien au clic.
    label: "CTO",
    clickLabel: "",
    clickValue: D(0),
    clickEnergyCost: 0,
  },
  entrepreneur: {
    // Le clic « Arbitrer la roadmap » était mort (le fondateur est un manager, revenu passif).
    // Les keynotes (chunk B) seront une mécanique armée, pas un clic de JobDef.
    label: "Fondateur",
    clickLabel: "",
    clickValue: D(0),
    clickEnergyCost: 0,
  },
  celebrite: {
    label: "Icône médiatique",
    clickLabel: "Publier un post",
    clickValue: D(0), // le clic donne des followers, pas de l'argent (voir work())
    clickEnergyCost: 6,
  },
  politique: {
    // « Tenir un meeting » est la mécanique de conversion followers → Emprise (cooldown propre, coût
    // en énergie), gérée par holdMeeting() dans actions.ts, PAS par work(). Le libellé revit ici pour
    // l'UI (chunk E) ; clickValue/clickEnergyCost restent neutres car work() ne le traite pas.
    label: "Figure politique",
    clickLabel: "Tenir un meeting",
    clickValue: D(0),
    clickEnergyCost: 0,
  },
  president: {
    label: "Président",
    clickLabel: "",
    clickValue: D(0),
    clickEnergyCost: 0,
  },
  monde: {
    label: "Maître du monde",
    clickLabel: "",
    clickValue: D(0),
    clickEnergyCost: 0,
  },
  empereur: {
    label: "Empereur cosmique",
    clickLabel: "",
    clickValue: D(0),
    clickEnergyCost: 0,
  },
};

// Prime d'embauche versée à l'arrivée en lead dev : un poste, ça paie, et cela évite le
// hard-lock du lead sans revenu (finance les 2 ou 3 premiers juniors avant tout salaire).
export const LEAD_HIRING_BONUS = 200; // €

export interface PromotionDef {
  from: Job;
  to: Job;
  cta: string; // libellé du bouton de promotion
  moneyThreshold: Decimal; // capital requis (combiné en ET avec les autres seuils présents)
  maxFollowersThreshold?: Decimal; // célébrité → politique : pic historique de followers requis
  empriseThreshold?: Decimal; // si défini, la promotion se débloque sur l'Emprise (Acte III)
  bugsThreshold?: number; // dev → lead : bugs résolus requis (ET missionsThreshold)
  missionsThreshold?: number; // dev → lead : missions livrées requises (ET bugsThreshold)
  decisionsThreshold?: number; // cto → fondateur : décisions tranchées requises (ET moneyThreshold)
  requiresUpgrade?: string; // fondateur → célébrité : upgrade requis (au moins une levée bouclée)
}

export const PROMOTIONS: PromotionDef[] = [
  { from: "developpeur", to: "lead_dev", cta: "Accepter le poste de lead dev", moneyThreshold: D(0), bugsThreshold: 40, missionsThreshold: 2 },
  { from: "lead_dev", to: "cto", cta: "Accepter le poste de CTO", moneyThreshold: D(3000) },
  { from: "cto", to: "entrepreneur", cta: "Fonder sa boîte d'IA", moneyThreshold: D(30000), decisionsThreshold: 5 },
  { from: "entrepreneur", to: "celebrite", cta: "Sortir de l'ombre", moneyThreshold: D(8_000_000), requiresUpgrade: "leve_amorcage" },
  { from: "celebrite", to: "politique", cta: "Entrer en politique", moneyThreshold: D(0), maxFollowersThreshold: D(50_000_000) },
  { from: "politique", to: "president", cta: "Prendre la présidence", moneyThreshold: D(0), empriseThreshold: D(5e4) },
  { from: "president", to: "monde", cta: "Régner sur le monde", moneyThreshold: D(0), empriseThreshold: D(1e7) },
  { from: "monde", to: "empereur", cta: "Régner sur le cosmos", moneyThreshold: D(0), empriseThreshold: D(5e9) },
];

export function nextPromotion(job: Job): PromotionDef | null {
  return PROMOTIONS.find((p) => p.from === job) ?? null;
}
