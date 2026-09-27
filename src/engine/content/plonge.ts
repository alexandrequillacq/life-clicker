// Chapitre 1 : le plongeur. Un restaurant qui salit des assiettes au rythme de ses couverts,
// une pile finie à laver, un calendrier, des machines UNIQUES (on répare, on règle, on cofinance :
// un plongeur n'achète pas quinze lave-vaisselle), des demandes au chef gatées par la vitesse du
// joueur, et le temps libre gagné en automatisant son travail (la bibliothèque).
// Zéro RNG : tout est daté. Spec : docs/superpowers/specs/2026-09-27-refonte-progression-cynisme-design.md

// --- Calendrier et affluence ---
export const DAY_SECS = 25; // un jour de jeu
export const PEAK_SECS = 8; // le coup de feu de midi : les premières secondes du jour
export const PEAK_SHARE = 0.5; // part des assiettes du jour qui arrive pendant le coup de feu
export const PLATES_PER_COVER = 3; // entrée, plat, dessert
export const START_COVERS = 40; // couverts par jour au départ
export const START_PILE = 12; // une pile t'attend déjà à ton arrivée (le premier bouton n'est jamais grisé)
export const PILE_BASE_CAP = 60; // au-delà de (base + couverts) assiettes en attente, le chef lave lui-même
export const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
export const SUNDAY = 6;

// --- Le travail ---
export const VALUE_PER_DISH = 0.05; // 5 centimes l'assiette
// Seul le clic lave à la main : une tâche manuelle ne s'automatise pas, c'est le lave-vaisselle qui prend le relais.

// --- Révélation : une information à la fois (secondes de calendrier, qui ne tournent pas hors-ligne) ---
export const PILE_VISIBLE_AT = 105; // le compteur d'assiettes apparaît quand la pile se vide (ou déborde) pour la première fois après ce temps
export const FIRST_ASK_AT = 615; // première demande au chef possible (et vieux lave-vaisselle réparé)
export const ASK_GAP_DAYS = 2; // au moins 2 jours entre deux demandes
export const FIRST_CALL_WEEK = 2; // Maman appelle à partir du 3e dimanche
export const SUNDAY_OFFER_DAY = 35; // « Proposer d'ouvrir le dimanche » : le 6e lundi, après un appel de Maman
export const LIVRET_AT = 1110; // le livret A se propose après ce temps
export const LIVRET_RATE = 0.05; // intérêts versés chaque lundi, en part de l'argent

// --- Le compromis : le cycle court ---
export const CYCLE_COURT_MULT = 1.3; // +30 % d'assiettes pour les deux machines (c'est un programme)
export const LOAD_SECS = 10; // une fournée = 10 s de machine en marche
export const GREASY_EVERY = 5; // en cycle court, une fournée sur cinq ressort grasse
export const RELAUNCH_SECS = 8; // relancer un cycle : la machine relave pendant 8 s

// --- La vie ---
export const ENERGY_REGEN = 2; // énergie/s récupérée en continu (le repos)
export const CALL_RING_SECS = 30; // l'appel de Maman sonne 30 s
export const CALL_TALK_SECS = 20; // décrocher occupe les mains 20 s
export const WINDOW_IDLE_SECS = 20; // « Regarder par la fenêtre » : après 20 s sans rien faire
export const ASK_EMPTY_SECS = 12; // pile vide au moins 12 s dans la journée : le chef veut bien grandir
export const PLONGE_OFFLINE_CAP = 600; // hors-ligne plafonné à 10 min au plongeur

// --- Équipement : objets uniques, chacun avec la statistique qu'il change ---
export interface EquipmentDef {
  id: string;
  cta: string;
  cost: number;
  requires?: string; // équipement prérequis (révélation en chaîne)
  revealAt?: number; // n'apparaît pas avant ce temps de calendrier
  revealDelay?: number; // n'apparaît que ce nombre de secondes après l'achat du prérequis
  dishesPerClick?: number; // fixe les assiettes lavées par clic
  oldRate?: number; // répare la vieille machine (assiettes/s)
  oldMult?: number; // multiplie la vieille machine seule (joint, panier, détartrage)
  proRate?: number; // le lave-vaisselle pro (assiettes/s)
  watch?: boolean; // la montre : affiche le jour et le coup de feu de midi
  note?: string; // précision ajoutée au sous-titre chiffré
  chef?: string; // réplique du chef à l'achat (id de CHEF_LINES)
}

export const EQUIPMENT: EquipmentDef[] = [
  { id: "gants", cta: "Mettre des gants de plonge", cost: 8, revealAt: 45, dishesPerClick: 2 },
  { id: "eponge", cta: "Acheter une vraie éponge", cost: 12, requires: "gants", dishesPerClick: 4 },
  { id: "montre", cta: "S'acheter une montre", cost: 30, requires: "eponge", revealDelay: 90, watch: true },
  { id: "reparer", cta: "Réparer le vieux lave-vaisselle de la réserve", cost: 35, requires: "montre", revealDelay: 75, oldRate: 4, chef: "reparer" },
  { id: "gants_pro", cta: "Enfiler des gants pro", cost: 40, requires: "reparer", revealDelay: 45, dishesPerClick: 6 },
  { id: "joint", cta: "Changer le joint du vieux lave-vaisselle", cost: 45, requires: "gants_pro", oldMult: 1.5 },
  { id: "panier", cta: "Acheter un deuxième panier à vaisselle", cost: 70, requires: "joint", oldMult: 1.5 },
  { id: "douchette", cta: "Installer une douchette de prélavage", cost: 90, requires: "panier", dishesPerClick: 8 },
  { id: "detartrer", cta: "Détartrer le vieux lave-vaisselle", cost: 110, requires: "douchette", oldMult: 1.5 },
  { id: "pro", cta: "Payer la moitié du lave-vaisselle pro", cost: 240, requires: "detartrer", proRate: 40, note: "Le chef paie l'autre moitié.", chef: "investissement" },
];

export const EQUIPMENT_BY_ID: Record<string, EquipmentDef> = Object.fromEntries(EQUIPMENT.map((e) => [e.id, e]));

// --- Les demandes au chef : le joueur réclame lui-même plus de travail, au même tarif ---
export interface AskDef {
  id: string;
  cta: string;
  covers?: number; // couverts par jour ajoutés
  sunday?: boolean; // ouvre le dimanche (Maman appelle alors en plein service)
  note?: string; // précision ajoutée au sous-titre chiffré (le prix de vie, écrit)
  chef?: string; // réplique du chef à l'acceptation
}

export const ASKS: AskDef[] = [
  { id: "soir", cta: "Proposer au chef d'ouvrir le soir", covers: 15, chef: "si_tu_suis" },
  { id: "formule", cta: "Proposer une formule du midi à 12 €", covers: 20 },
  { id: "terrasse", cta: "Proposer d'installer une terrasse", covers: 25 },
  { id: "groupes", cta: "Proposer d'accepter les groupes", covers: 35 },
  { id: "brunch", cta: "Proposer un brunch le samedi", covers: 45 },
  { id: "livraison", cta: "Proposer de s'inscrire sur une appli de livraison", covers: 65 },
  { id: "seminaires", cta: "Proposer de louer la salle pour des séminaires", covers: 85 },
  { id: "mariages", cta: "Proposer de faire traiteur pour des mariages", covers: 120, chef: "meilleure_chose" },
];

/** Hors de la file : une proposition unique, datée (le 6e lundi, une fois que Maman a appelé). */
export const SUNDAY_OFFER: AskDef = { id: "dimanche", cta: "Proposer d'ouvrir le dimanche", sunday: true, note: "Tu travailles le dimanche.", chef: "ta_mere" };

// --- La bibliothèque : le temps libre gagné en automatisant son travail ---
export interface StudyItemDef {
  id: string;
  cta: string; // achat
  cost: number;
  name: string; // nom affiché dans « Tes études »
  step: string; // action pour avancer (consomme de l'énergie)
  lastStep?: string; // libellé de la dernière étape (« Passer l'examen »)
  energy: number; // énergie par étape
  steps: number; // étapes pour finir
  unit: string; // unité de progression affichée (« pages », « séances »…)
  perStep: number; // unités gagnées par étape (20 pages)
  requiresDone?: string; // ne s'achète qu'une fois cette étude terminée
  done: string; // ligne à la fin
}

export const LIBRARY: StudyItemDef[] = [
  { id: "html", cta: "Acheter un manuel de HTML d'occasion", cost: 30, name: "Manuel de HTML d'occasion", step: "Lire 20 pages", energy: 10, steps: 6, unit: "pages", perStep: 20, done: "Tu sais ce qu'est une balise. Ta première page web dit « Bonjour »." },
  { id: "cours", cta: "S'inscrire au cours du soir de la mairie", cost: 45, name: "Cours du soir de la mairie", step: "Aller au cours du soir", energy: 20, steps: 8, unit: "séances", perStep: 1, done: "Le prof dit que tu as un bon niveau." },
  { id: "js", cta: "Acheter un manuel de JavaScript", cost: 60, name: "Manuel de JavaScript", step: "Lire 20 pages", energy: 10, steps: 6, unit: "pages", perStep: 20, done: "Ton bouton change de couleur quand on clique dessus." },
  { id: "ordi", cta: "Acheter un ordinateur portable reconditionné", cost: 150, name: "Ordinateur portable reconditionné", step: "Faire un exercice", energy: 15, steps: 5, unit: "exercices", perStep: 1, done: "Il chauffe, mais il tient." },
  { id: "examen", cta: "S'inscrire à l'examen du cours du soir", cost: 40, name: "Examen du cours du soir", step: "Réviser l'examen", lastStep: "Passer l'examen", energy: 15, steps: 4, unit: "étapes", perStep: 1, requiresDone: "cours", done: "Reçu. 16 sur 20." },
];

export const LIBRARY_BY_ID: Record<string, StudyItemDef> = Object.fromEntries(LIBRARY.map((l) => [l.id, l]));

// --- Ce que dit le chef (canal périphérique : il euphémise, il ne commente jamais le joueur) ---
export const CHEF_LINES: Record<string, string> = {
  debut: "5 centimes l'assiette. En liquide.",
  banque: "Tu vides tes poches au guichet.",
  reparer: "Il marche ? Il reste au restaurant.",
  si_tu_suis: "Si tu suis, moi je veux bien.",
  ta_mere: "Ta mère comprendra.",
  debordement: "Le chef a fait la plonge lui-même. Il n'a rien dit.",
  plainte: "Un client s'est plaint de la propreté de son assiette. Le chef l'a essuyée et l'a resservie.",
  investissement: "On dira que c'est un investissement.",
  gants_poses: "Tu la lances le matin et tu rentres. Toujours 5 centimes l'assiette.",
  meilleure_chose: "Tu es la meilleure chose qui soit arrivée à ce restaurant. Toujours 5 centimes l'assiette.",
  annonce: "Ta moitié de machine ? Je la garde. Un investissement, on avait dit.",
};

// --- Souvenirs (côté vie perso) : ce que le joueur a vécu, ou manqué ---
// Au restaurant, puis chez soi une fois les gants posés (le parking ne se voit plus d'en haut).
export const WINDOW_LINES = [
  "Tu as regardé la pluie tomber sur le parking.",
  "Tu as regardé le livreur fumer sous l'auvent.",
  "Tu as regardé un pigeon voler une frite.",
];
export const WINDOW_LINES_HOME = [
  "Tu as regardé le voisin d'en face arroser ses tomates.",
  "Tu as regardé un chat traverser la cour.",
  "Tu as regardé le soleil passer derrière l'immeuble d'en face.",
];
export const CALL_SOUVENIR = "Maman t'a raconté son jardin.";
export const CALL_MISSED = "Maman a laissé un message vocal.";
export const LIVRET_CTA = "Ouvrir un livret A";
export const STUDY_TEASER = "Quand les machines tourneront seules, tu auras le temps d'étudier.";
export const AGE_PLONGEUR = 22;

export const ANNONCE_TEXT = "Boulangerie Duval. Cherche quelqu'un pour faire notre site.";
export const ANNONCE_CTA = "Répondre à l'annonce de Mme Duval";
