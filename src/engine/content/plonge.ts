// Chapitre 1 : le plongeur. Un restaurant qui salit des assiettes au rythme de ses couverts,
// une pile finie à laver, un calendrier, des machines UNIQUES (on répare, on règle, on cofinance :
// un plongeur n'achète pas quinze lave-vaisselle), des demandes au chef gatées par la vitesse du
// joueur, et le temps libre gagné en automatisant son travail (la bibliothèque).
// Zéro RNG : tout est daté. Spec : docs/superpowers/specs/2026-09-27-refonte-progression-cynisme-design.md

// --- Calendrier et affluence ---
export const DAY_SECS = 15; // un jour de jeu (le temps file : un restaurant plein, des journées qui s'enchaînent)
export const PEAK_SECS = 5; // le coup de feu de midi : les premières secondes du jour
export const PEAK_SHARE = 0.5; // part des assiettes du jour qui arrive pendant le coup de feu
export const PLATES_PER_COVER = 3; // entrée, plat, dessert
export const START_COVERS = 200; // couverts par jour au départ : le restaurant salit plus que tu ne peux laver
export const START_PILE = 12; // une pile t'attend déjà à ton arrivée (le premier bouton n'est jamais grisé)
export const PILE_BASE_CAP = 60; // au-delà de (base + couverts) assiettes en attente, le chef lave lui-même
export const PILE_WARN_SHARE = 0.7; // pile remplie à 70 % : l'écran prévient ; en dessous, la réplique du débordement s'efface
export const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
export const SUNDAY = 6;

// --- Le travail ---
export const VALUE_PER_DISH = 0.05; // 5 centimes l'assiette
// Seul le clic lave à la main : une tâche manuelle ne s'automatise pas, c'est le lave-vaisselle qui prend le relais.

// --- Les nouveautés : une information à la fois (secondes de calendrier, qui ne tournent pas hors-ligne) ---
export const NOVELTY_GAP = 35; // au moins 35 s entre une nouveauté et la suivante que le jeu révèle de lui-même

/**
 * Comment une nouveauté paraît :
 * - « jeu » : le jeu la révèle de lui-même ; elle attend son tour dans la file (NOVELTY_GAP après la
 *   nouveauté précédente) puis repousse la suivante. L'ordre de la table départage deux nouveautés prêtes ensemble.
 * - « geste » : la conséquence immédiate d'une action du joueur (un achat qui change l'écran) ; elle ne
 *   l'attend pas, mais repousse la nouveauté suivante du jeu.
 * - « offre » : un achat qui se propose dès qu'il est prêt, sans rien repousser.
 */
export type RevealKind = "jeu" | "geste" | "offre";

export interface RevealDef {
  id: string; // clé de la nouveauté (pour une offre : l'id de l'équipement)
  kind: RevealKind;
  at?: number; // pas avant ce temps de calendrier (secondes depuis le premier lundi)
  after?: Record<string, number>; // au moins N s après l'UN de ces événements (le premier arrivé suffit)
  needs?: string[]; // ces événements ont TOUS eu lieu
  when?: string[]; // conditions nommées, évaluées par le moteur (voir CONDITIONS dans engine/plonge/revelations.ts)
}
// Événements datés : un achat d'équipement (son id), une nouveauté du jeu (son id), « gants_poses »
// (le joueur pose les gants) et « service_call » (le premier appel de Maman en plein service).

const days = (n: number): number => n * DAY_SECS;

/** La file des nouveautés : une ligne par chose qui paraît à l'écran. */
export const REVEALS: RevealDef[] = [
  // Ce que le jeu révèle de lui-même. L'ordre départage deux nouveautés prêtes au même instant : d'abord les
  // moments qui ne durent qu'un tick (dimanche midi, une fournée qui sort), sinon ils seraient perdus jusqu'au
  // prochain ; puis les conditions qui tiendront encore au tick suivant.
  { id: "maman", kind: "jeu", at: days(27), when: ["dimanche_midi"] }, // Maman appelle à partir du 4e dimanche
  { id: "service", kind: "jeu", needs: ["maman"], when: ["dimanche_midi", "en_service"] }, // le premier appel en plein service
  { id: "grasses", kind: "jeu", when: ["fournee_grasse"] }, // la première fournée grasse
  { id: "pile", kind: "jeu", at: 80, when: ["pile_vide_ou_deborde"] }, // le compteur d'assiettes sales
  { id: "chef", kind: "jeu", after: { reparer: 35 } }, // « Le chef » et ses demandes
  { id: "dimanche", kind: "jeu", after: { panier: 35 }, needs: ["maman"], when: ["pas_d_appel"] }, // « Proposer d'ouvrir le dimanche »
  { id: "livret", kind: "jeu", after: { service_call: 60, panier: 240 }, when: ["pas_d_appel"] }, // le livret A
  { id: "offre_pro", kind: "jeu", after: { detartrer: 180 } }, // le lave-vaisselle pro se propose
  { id: "repas", kind: "jeu", after: { gants_poses: 35 } }, // « Se faire à manger »

  // Les achats, dans l'ordre où ils se proposent.
  { id: "gants", kind: "offre", at: 45 },
  { id: "eponge", kind: "offre", after: { gants: 0 } },
  { id: "montre", kind: "offre", after: { eponge: 75 } },
  { id: "reparer", kind: "offre", after: { montre: 45 } },
  { id: "gants_pro", kind: "offre", after: { reparer: 45 } },
  { id: "joint", kind: "offre", after: { gants_pro: 30 } },
  { id: "panier", kind: "offre", after: { joint: 0 } },
  { id: "douchette", kind: "offre", after: { panier: 30 } },
  { id: "detartrer", kind: "offre", after: { douchette: 0 } },
  { id: "pro", kind: "offre", after: { offre_pro: 0 } },

  // Ce qu'un geste du joueur fait paraître aussitôt.
  { id: "jour", kind: "geste", after: { montre: 0 } }, // la montre donne le jour et le coup de feu
  { id: "machine", kind: "geste", after: { reparer: 0 } }, // le vieux lave-vaisselle et ce qu'il rapporte
  { id: "cycle_court", kind: "geste", after: { joint: 0 } }, // le compromis se propose
  { id: "teaser", kind: "geste", after: { detartrer: 0 } }, // « Quand les machines tourneront seules… »
  { id: "poser_gants", kind: "geste", after: { pro: 0 } }, // « Poser les gants »
  { id: "etudes", kind: "geste", after: { gants_poses: 0 } }, // « Tes études » et l'énergie
  { id: "couverts", kind: "geste", when: ["demande_acceptee"] }, // les couverts, avec la première demande
  { id: "jours_ouverts", kind: "geste", when: ["dimanche_ouvert"] }, // le restaurant ouvre le dimanche
];

export const REVEAL_BY_ID: Record<string, RevealDef> = Object.fromEntries(REVEALS.map((r) => [r.id, r]));

// --- Le chef et la banque ---
export const ASK_GAP_DAYS = 1; // au plus une demande par jour
export const LIVRET_RATE = 0.05; // intérêts versés chaque lundi, en part de l'argent

// --- Le compromis : le cycle court ---
export const CYCLE_COURT_MULT = 1.3; // +30 % d'assiettes pour les deux machines (c'est un programme)
export const LOAD_SECS = 10; // une fournée = 10 s de machine en marche
export const GREASY_EVERY = 5; // en cycle court, une fournée sur cinq ressort grasse
export const RELAUNCH_SECS = 8; // relancer un cycle : la machine relave pendant 8 s

// --- La vie ---
export const ENERGY_REGEN = 0.3; // énergie/s récupérée en continu (le repos, lent : on la regagne surtout en vivant)
export const MEAL_ENERGY = 10; // « Se faire à manger »
export const MEALS_PER_DAY = 2; // deux repas par jour
export const CALL_RING_SECS = 30; // l'appel de Maman sonne 30 s
export const CALL_TALK_SECS = 20; // au téléphone, tout s'arrête 20 s ; en raccrochant, l'énergie est pleine
export const WINDOW_IDLE_SECS = 20; // « Regarder par la fenêtre » : après 20 s sans rien faire
export const EMPTY_LABEL_SECS = 1.5; // pile vide depuis ce temps : le bouton l'annonce (évite qu'il clignote en cliquant vite)
export const ASK_EMPTY_SECS = 6; // moins d'une brassée d'assiettes sales 6 s dans la journée : tu suis, le chef veut bien grandir
export const PLONGE_OFFLINE_CAP = 600; // hors-ligne plafonné à 10 min au plongeur

// --- Équipement : objets uniques, chacun avec la statistique qu'il change ---
// Quand chacun se propose : voir REVEALS (les offres).
export interface EquipmentDef {
  id: string;
  cta: string;
  cost: number;
  dishesPerClick?: number; // fixe les assiettes lavées par clic
  oldRate?: number; // répare la vieille machine (assiettes/s)
  oldMult?: number; // multiplie la vieille machine seule (joint, panier, détartrage)
  proRate?: number; // le lave-vaisselle pro (assiettes/s)
  watch?: boolean; // la montre : affiche le jour et le coup de feu de midi
  note?: string; // précision ajoutée au sous-titre chiffré
  chef?: string; // réplique du chef à l'achat (id de CHEF_LINES)
}

export const EQUIPMENT: EquipmentDef[] = [
  { id: "gants", cta: "Mettre des gants de plonge", cost: 3, dishesPerClick: 2 },
  { id: "eponge", cta: "Acheter une vraie éponge", cost: 6, dishesPerClick: 3 },
  { id: "montre", cta: "S'acheter une montre", cost: 65, watch: true },
  { id: "reparer", cta: "Réparer le vieux lave-vaisselle de la réserve", cost: 45, oldRate: 6, chef: "reparer" },
  { id: "gants_pro", cta: "Enfiler des gants pro", cost: 80, dishesPerClick: 4 },
  { id: "joint", cta: "Changer le joint du vieux lave-vaisselle", cost: 50, oldMult: 1.5 },
  { id: "panier", cta: "Acheter un deuxième panier à vaisselle", cost: 160, oldMult: 1.5 },
  { id: "douchette", cta: "Installer une douchette de prélavage", cost: 200, dishesPerClick: 5 },
  { id: "detartrer", cta: "Détartrer le vieux lave-vaisselle", cost: 260, oldMult: 1.5 },
  { id: "pro", cta: "Payer la moitié du lave-vaisselle pro", cost: 720, proRate: 40, note: "Le chef paie l'autre moitié.", chef: "investissement" },
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
  { id: "soir", cta: "Proposer au chef d'ouvrir le soir", covers: 20, chef: "si_tu_suis" },
  { id: "formule", cta: "Proposer une formule du midi à 12 €", covers: 25 },
  { id: "terrasse", cta: "Proposer d'installer une terrasse", covers: 30 },
  { id: "groupes", cta: "Proposer d'accepter les groupes", covers: 35 },
  { id: "brunch", cta: "Proposer un brunch le samedi", covers: 40 },
  { id: "livraison", cta: "Proposer de s'inscrire sur une appli de livraison", covers: 50 },
  { id: "seminaires", cta: "Proposer de louer la salle pour des séminaires", covers: 60 },
  { id: "mariages", cta: "Proposer de faire traiteur pour des mariages", covers: 70, chef: "meilleure_chose" },
];

/** Hors de la file des demandes : une proposition unique (quand elle paraît : la ligne « dimanche » de REVEALS). */
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
  { id: "html", cta: "Acheter un manuel de HTML d'occasion", cost: 30, name: "Manuel de HTML d'occasion", step: "Lire 10 pages", energy: 5, steps: 12, unit: "pages", perStep: 10, done: "Tu sais ce qu'est une balise. Ta première page web dit « Bonjour »." },
  { id: "cours", cta: "S'inscrire au cours du soir de la mairie", cost: 45, name: "Cours du soir de la mairie", step: "Aller au cours du soir", energy: 10, steps: 8, unit: "séances", perStep: 1, done: "Le prof dit que tu as un bon niveau." },
  { id: "js", cta: "Acheter un manuel de JavaScript", cost: 60, name: "Manuel de JavaScript", step: "Lire 10 pages", energy: 5, steps: 12, unit: "pages", perStep: 10, done: "Ton bouton change de couleur quand on clique dessus." },
  { id: "ordi", cta: "Acheter un ordinateur portable reconditionné", cost: 150, name: "Ordinateur portable reconditionné", step: "Faire un exercice", energy: 8, steps: 8, unit: "exercices", perStep: 1, done: "Il chauffe, mais il tient." },
  { id: "examen", cta: "S'inscrire à l'examen du cours du soir", cost: 40, name: "Examen du cours du soir", step: "Réviser l'examen", lastStep: "Passer l'examen", energy: 8, steps: 4, unit: "étapes", perStep: 1, requiresDone: "cours", done: "Reçu. 16 sur 20." },
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
export const AGE_PLONGEUR = 22;

// --- Tous les autres textes joueur du chapitre (les chiffres arrivent déjà formatés : « 12,34 € », « 7,5 ») ---
type N = number | string;
const pl = (n: number, one: string, many: string): string => (n > 1 ? many : one);
export const TEXTES = {
  // En tête
  money: (euros: string) => `Argent : ${euros}`,
  autoIncome: (plural: boolean, euros: string) => `${plural ? "Les lave-vaisselle te rapportent" : "Le lave-vaisselle te rapporte"} ${euros} / min`,
  livretRate: (pct: N) => `Livret A : ${pct} % chaque lundi`,
  livretLast: (euros: string) => `Livret A : +${euros} lundi dernier`,

  // Travail
  colWork: "Travail",
  dayClosed: (day: string) => `${day}, restaurant fermé`,
  dayPeak: (day: string) => `${day}, coup de feu de midi`,
  pile: (n: N) => `Assiettes sales : ${n}`,
  pileWarn: (cap: N) => `Au-delà de ${cap}, le chef les lave lui-même.`,
  overflowToday: (n: N) => `Aujourd'hui, il en a lavé ${n}.`,
  covers: (n: N) => `${n} couverts par jour`,
  wash: (n: number) => (n === 1 ? "Laver une assiette" : `Laver ${n} assiettes`),
  washEmpty: "Aucune assiette sale",
  washPhone: "Tu es au téléphone",

  // Lave-vaisselle
  machineTitle: "Lave-vaisselle",
  machineRate: (rate: string) => `${rate} assiettes / s`,
  greasy: "Assiettes grasses. Le lave-vaisselle est à l'arrêt.",
  relaunch: "Relancer un cycle",
  shelve: "Les ranger quand même",
  greasyChoice: (secs: N) => `Relancer : ${secs} s sans assiette propre. Les ranger : aucun arrêt.`,
  relaunching: (secs: N) => `Le lave-vaisselle relave la fournée (${secs} s).`,
  cycleCourtCta: "Programmer le lave-vaisselle en cycle court",
  cycleCourtGreasy: "Certaines assiettes ressortent grasses.",
  free: "gratuit",

  // Sous-titres des achats
  upgradesTitle: "Améliorations",
  perClick: (a: N, b: N) => `Par clic : ${a} → ${b} assiettes`,
  watch: ["Affiche le jour de la semaine", "Et le coup de feu de midi : la moitié des assiettes du jour"],
  oldMachine: (a: string, b: string) => `Vieux lave-vaisselle : ${a} → ${b} assiettes / s`,
  bothMachines: (a: string, b: string) => `Lave-vaisselle : ${a} → ${b} assiettes / s`,
  repairIncome: (euros: string) => `Il te rapporte ${euros} / min, même sans toi.`,
  incomeChange: (plural: boolean, a: string, b: string) => `${plural ? "Les lave-vaisselle te rapportent" : "Il te rapporte"} : ${a} → ${b} / min`,
  incomeCapped: "Pas plus : le restaurant ne salit pas plus d'assiettes.",
  proNoGreasy: "Plus d'assiettes grasses : il lave bien, même en cycle court.",

  // Le chef
  chefTitle: "Le chef",
  askedToday: "Tu as déjà proposé aujourd'hui. Le chef répondra demain.",
  askTarget: (n: number, secs: N) => `Le chef dit oui si tu suis : moins de ${n} ${pl(n, "assiette sale", "assiettes sales")} pendant ${secs} s dans la journée`,
  askProgress: (done: N, secs: N) => `Aujourd'hui : ${done} s sur ${secs}`,
  askCovers: (a: N, b: N) => `Couverts par jour : ${a} → ${b}`,
  coverPlates: (n: N) => `1 couvert = ${n} assiettes sales`,
  openDays: (a: N, b: N) => `Jours ouverts par semaine : ${a} → ${b}`,

  // La banque
  bankTitle: "La banque",
  livretCta: "Ouvrir un livret A",
  livretEach: (pct: N) => `Chaque lundi : +${pct} % de ton argent`,
  livretToday: (euros: string) => `Aujourd'hui, ce serait +${euros}`,

  // Poser les gants, l'annonce
  poseGantsCta: "Poser les gants",
  poseGants: (rate: string, dirty: string) => `Tu arrêtes de laver. Les lave-vaisselle suivent seuls : ${rate} assiettes / s pour ${dirty} de vaisselle en moyenne.`,
  poseGantsStudies: "Nouveau : tes études.",
  annonceText: "Boulangerie Duval. Cherche quelqu'un pour faire notre site.",
  annonceCta: "Répondre à l'annonce de Mme Duval",
  annonceEffects: ["Tu quittes la plonge. Tu fais des sites, payés à la livraison."],

  // Ta vie
  colLife: "Ta vie",
  age: (n: N) => `${n} ans`,
  energy: (n: N, max: N) => `Énergie : ${n} / ${max}`,
  callRinging: "Maman appelle.",
  callAnswer: "Décrocher",
  callTalk: (secs: N) => `${secs} s au téléphone : tout s'arrête`,
  callEnergy: (a: N, b: N) => `Énergie : ${a} → ${b}`,
  callLoss: (euros: string) => `Pendant ce temps, le chef lave à ta place. Tu perds environ ${euros}.`,
  onPhone: "Tu es au téléphone avec Maman.",
  onPhoneLeft: (secs: N) => `Encore ${secs} s`,
  mealCta: "Se faire à manger",
  mealEnergy: (a: N, b: N) => `Énergie : ${a} → ${b}`,
  mealsPerDay: (n: N) => `${n} repas par jour`,
  mealDone: "Tu as déjà mangé. Demain.",
  studiesTitle: "Tes études",
  studyTeaser: "Quand les machines tourneront seules, tu auras le temps d'étudier.",
  studyCost: (energy: N) => `Coûte ${energy} énergie`,
  studyAdvance: (unit: string, a: N, b: N, total: N) => `${unit[0].toUpperCase()}${unit.slice(1)} : ${a} → ${b} sur ${total}`,
  studyProgress: (done: N, total: N, unit: string) => `${done} / ${total} ${unit}`,
  studyBuy: (total: N, unit: string, energy: N, perStep: number) =>
    `${total} ${unit}, ${energy} énergie ${perStep > 1 ? `les ${perStep} ${unit}` : `par ${unit.replace(/s$/, "")}`}`,
  windowCta: "Regarder par la fenêtre",
  souvenirsTitle: "Souvenirs",
  souvenir: (day: string, text: string) => `${day} : ${text.startsWith("Tu ") ? `t${text.slice(1)}` : text}`,
};
