import { D, type Decimal } from "../numbers";

// Cartes de décision du CTO (verbe : trancher). File auteurée et séquentielle de 5 cartes.
// Chaque carte apparaît à un seuil de GAINS CUMULÉS depuis l'entrée en poste de CTO
// (pas l'argent en caisse : évite l'empilement). Les effets sont déclaratifs (pas de closures)
// et permanents. Titre de section pour l'UI : « Trancher une décision technique ».

export const DECISIONS_SECTION_TITLE = "Trancher une décision technique";

/** Effet déclaratif d'une option. Les *Mult multiplient l'état courant ; cash/cost jouent sur la caisse. */
export interface DecisionEffect {
  label: string; // CTA de l'option
  teamOutputMult?: number; // multiplie le brut d'équipe
  gpuCostMult?: number; // multiplie le coût des GPU
  hireCostMult?: number; // multiplie le coût des embauches
  gpuErosionMult?: number; // multiplie l'érosion du brut par GPU
  aiRateMult?: number; // multiplie le débit de l'IA
  incidentPeriodMult?: number; // multiplie la période entre incidents (>1 = plus rares)
  setIncidentAutoResolve?: number; // fixe la durée d'auto-extinction d'un incident (secondes)
  cash?: number; // € versés immédiatement (encaissement)
  cost?: number; // € one-shot requis (refuse si insuffisant, laisse la carte en attente)
}

export interface DecisionCard {
  id: string;
  threshold: Decimal; // gains cumulés (ctoEarned) requis pour que la carte apparaisse
  title: string; // intitulé de l'arbitrage
  optionA: DecisionEffect;
  optionB: DecisionEffect;
}

export const DECISIONS: DecisionCard[] = [
  {
    id: "infra",
    threshold: D(3500),
    title: "Où faire tourner l'infrastructure ?",
    optionA: { label: "Migrer vers le cloud", teamOutputMult: 1.15 },
    optionB: { label: "Monter ses propres serveurs", gpuCostMult: 0.9 },
  },
  {
    id: "process",
    threshold: D(7000),
    title: "Comment cadrer le développement ?",
    optionA: { label: "Imposer la revue de code", incidentPeriodMult: 2, setIncidentAutoResolve: 10 },
    optionB: { label: "Livrer plus vite", teamOutputMult: 1.1 },
  },
  {
    id: "dette",
    threshold: D(12000),
    title: "Que faire de la dette technique ?",
    optionA: { label: "Payer la dette technique", cost: 2000, teamOutputMult: 1.2 },
    optionB: { label: "Encaisser sans payer la dette", cash: 2500, incidentPeriodMult: 0.5 },
  },
  {
    id: "outillage",
    threshold: D(18000),
    title: "Quelle politique d'outillage ?",
    optionA: { label: "Standardiser l'outillage", hireCostMult: 0.9 },
    optionB: { label: "Laisser chacun choisir", teamOutputMult: 1.05 },
  },
  {
    id: "ia",
    threshold: D(25000),
    title: "Quel rôle pour l'IA dans l'équipe ?",
    optionA: { label: "Former l'équipe à l'IA", gpuErosionMult: 0.75 },
    optionB: { label: "Garder l'IA pour l'infra", aiRateMult: 1.15 },
  },
];
