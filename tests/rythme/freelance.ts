import { createInitialState, type GameState } from "../../src/engine/state";
import { tick } from "../../src/engine/loop";
import {
  startFreelance,
  workClick,
  canWork,
  canCreateCompany,
  createCompany,
  visibleProposals,
  acceptProposal,
  toolOffered,
  canBuyTool,
  buyTool,
  homeOffered,
  moveHome,
  canEat,
  eat,
  deliveryOffered,
  acceptDelivery,
  canGoToDinner,
  goToDinner,
  canAnswerMaman,
  answerMaman,
  mamanIAOffered,
  acceptMamanIA,
  compromisVisible,
  takeCompromis,
  noraOffered,
  energyMax,
  currentHome,
} from "../../src/engine/freelance";

// Un joueur simulé du chapitre 2 : il clique à un rythme fixe et prend ce qui se présente.
// La sonde lit le temps de calendrier (s.freelance.day), le même que le jeu.

export interface FlJoueur {
  cps: number; // clics par seconde
  buys: boolean; // accepte les outils, les propositions, les logements, les repas livrés, le compromis
  answersMaman: boolean; // décroche (jusqu'à ce que le répondeur IA se propose, qu'il accepte s'il achète)
  dinners: boolean; // va aux dîners
  stopsAfterAI?: boolean; // arrête de cliquer dès que l'IA qui écrit les pages neuves est achetée (spec R7)
}
export interface FlTrace {
  exitAt: number | null; // Nora proposée
  reveals: [string, number][];
  maxGap: number; // plus long silence entre deux nouveautés, avant la sortie
  tools: string[];
  proposals: string[];
  weeks: number[]; // net de chaque semaine close
}

const DT = 0.05;

export function playFreelance(j: FlJoueur, maxSecs: number, setup?: (s: GameState) => void): { s: GameState; trace: FlTrace } {
  const s = createInitialState(0);
  startFreelance(s);
  setup?.(s);
  const f = s.freelance;
  let acc = 0;
  let exitAt: number | null = null;
  for (let t = 0; t < maxSecs && exitAt === null; t += DT) {
    const clicking = !(j.stopsAfterAI && f.tools.ia_pages !== undefined);
    acc += clicking ? j.cps * DT : 0;
    while (acc >= 1) {
      acc -= 1;
      if (canWork(s)) workClick(s);
    }
    if (canCreateCompany(s)) createCompany(s, "Pixel", 0);
    if (j.buys) {
      for (const p of visibleProposals(s)) acceptProposal(s, p.id);
      const tool = toolOffered(s);
      if (tool && canBuyTool(s, tool.id)) buyTool(s, tool.id);
      if (homeOffered(s)) moveHome(s);
      if (deliveryOffered(s)) acceptDelivery(s);
      if (compromisVisible(s)) takeCompromis(s);
      if (mamanIAOffered(s)) acceptMamanIA(s);
    }
    if (canEat(s) && s.energy <= energyMax(s) - currentHome(s).meal) eat(s);
    if (j.answersMaman && canAnswerMaman(s)) answerMaman(s);
    if (j.dinners && canGoToDinner(s)) goToDinner(s);
    tick(s, DT);
    if (noraOffered(s)) exitAt = f.day;
  }
  const reveals = Object.entries(f.revealed).sort((a, b) => a[1] - b[1]);
  const end = exitAt ?? f.day;
  const times = [0, ...reveals.map((r) => r[1]).filter((x) => x <= end), end];
  let maxGap = 0;
  for (let i = 1; i < times.length; i++) maxGap = Math.max(maxGap, times[i] - times[i - 1]);
  return {
    s,
    trace: {
      exitAt,
      reveals,
      maxGap,
      tools: Object.keys(f.tools),
      proposals: Object.keys(f.proposals),
      weeks: f.history.map((w) => w.net),
    },
  };
}
