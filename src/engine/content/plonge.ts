// Chapitre 1 : le plongeur. Un restaurant qui salit des assiettes au rythme de ses couverts,
// une pile finie à laver, un calendrier, des machines UNIQUES (on répare, on règle, on cofinance :
// un plongeur n'achète pas quinze lave-vaisselle), des demandes au chef gatées par la vitesse du
// joueur, et le temps libre gagné en automatisant son travail (la bibliothèque).
// Zéro RNG : tout est daté. Spec : docs/superpowers/specs/2026-09-27-refonte-progression-cynisme-design.md
//
// L'équilibre : tantôt tu laves moins vite que le restaurant ne salit (une amélioration du clic ou des machines
// se propose), tantôt tu le suis (le chef accepte une demande qui ajoute des couverts). On est toujours à la
// limite de l'un ou de l'autre, et on gagne de plus en plus.

// --- Calendrier et affluence ---
export const DAY_SECS = 15; // un jour de jeu (le temps file : un restaurant plein, des journées qui s'enchaînent)
export const PLATES_PER_COVER = 1; // une assiette sale par couvert, en moyenne
export const START_COVERS = 50; // couverts par jour au départ
export const START_PILE = 12; // une pile t'attend déjà à ton arrivée (le premier bouton n'est jamais grisé)
export const PILE_BASE_CAP = 60; // au-delà de (base + couverts) assiettes en attente, le chef lave lui-même
export const PILE_WARN_SHARE = 0.7; // pile remplie à 70 % : l'écran prévient ; en dessous, la réplique du débordement s'efface
export const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
export const SUNDAY = 6; // le restaurant est fermé le dimanche (tant qu'on ne propose pas d'ouvrir)

// --- Le travail ---
export const VALUE_PER_DISH = 0.05; // 5 centimes l'assiette
// Seul le clic lave à la main : une tâche manuelle ne s'automatise pas, c'est le lave-vaisselle qui prend le relais.

// --- Suivre ou non le restaurant (les jours ouverts) ---
// Une « brassée » : ce que lave un clic, ou une seconde de machines une fois les gants posés.
export const KEEP_UP_SECS = 6; // moins d'une brassée d'assiettes sales pendant 6 s dans la journée : tu suis, le chef accepte une demande
export const BEHIND_SECS = 6; // plus de BEHIND_LOADS brassées pendant 6 s dans la journée : tu ne suis plus, une amélioration se propose
export const BEHIND_LOADS = 2;
export const ASK_MIN_GAP = 35; // au moins 35 s entre deux demandes au chef (pas de rafale quand les machines devancent le restaurant)
export const ASK_LATE = 120; // la demande suivante se propose au plus tard 120 s après la précédente, même si tu ne suis pas

// --- Les nouveautés : une information à la fois (secondes de calendrier, qui ne tournent pas hors-ligne) ---
export const NOVELTY_GAP = 35; // au moins 35 s entre une nouveauté et la suivante que le jeu révèle de lui-même

/**
 * Comment une nouveauté paraît :
 * - « jeu » : le jeu la révèle de lui-même ; elle attend son tour dans la file (NOVELTY_GAP après la
 *   nouveauté précédente) puis repousse la suivante. L'ordre de la table départage deux nouveautés prêtes ensemble.
 * - « geste » : la conséquence immédiate d'une action du joueur (un achat qui change l'écran) ; elle ne
 *   l'attend pas, mais repousse la nouveauté suivante du jeu.
 * - « offre » : un achat qui se propose dès qu'il est prêt, sans rien repousser ; une fois proposé, il le reste.
 */
export type RevealKind = "jeu" | "geste" | "offre";

export interface RevealDef {
  id: string; // clé de la nouveauté (pour une offre : l'id de l'équipement ou de la concession)
  kind: RevealKind;
  at?: number; // pas avant ce temps de calendrier (secondes depuis le premier lundi)
  earned?: number; // pas avant d'avoir gagné ce nombre d'euros à la plonge, au total (ne redescend jamais)
  after?: Record<string, number>; // au moins N s après l'UN de ces événements (le premier arrivé suffit)
  needs?: string[]; // ces événements ont TOUS eu lieu
  when?: string[]; // conditions nommées, évaluées par le moteur (voir CONDITIONS dans engine/plonge/revelations.ts)
  fallback?: Record<string, number>; // sinon, au plus tard N s après l'un de ces événements, même si `when` n'est pas rempli
}
// Événements datés : un achat (id de l'équipement, de la concession ou de l'étude), une demande acceptée (son id),
// une nouveauté du jeu (son id), « gants_poses », « service_call » (le premier appel de Maman en plein service),
// « appel_N » (le N-ième appel décroché) et « sonnerie_N » (le N-ième dimanche où Maman a appelé).

const days = (n: number): number => n * DAY_SECS;
const LATE = 120; // une amélioration se propose au plus tard 120 s après la précédente, même si tu suis encore

/** La file des nouveautés : une ligne par chose qui paraît à l'écran. */
export const REVEALS: RevealDef[] = [
  // Ce que le jeu révèle de lui-même. L'ordre départage deux nouveautés prêtes au même instant : d'abord les
  // moments qui ne durent qu'un tick (le dimanche qui commence, une fournée qui sort), sinon ils seraient perdus
  // jusqu'au prochain ; puis les conditions qui tiendront encore au tick suivant.
  { id: "maman", kind: "jeu", at: days(27), when: ["debut_dimanche"] }, // Maman appelle à partir du 4e dimanche
  { id: "service", kind: "jeu", needs: ["maman"], when: ["debut_dimanche", "en_service"] }, // le premier appel en plein service
  { id: "grasses", kind: "jeu", when: ["fournee_grasse"] }, // la première fournée grasse
  { id: "pile", kind: "jeu", earned: 1 }, // le compteur d'assiettes sales, dès le premier euro
  { id: "chef", kind: "jeu", after: { gants: 0 } }, // « Le chef » et ses demandes
  { id: "dimanche", kind: "jeu", after: { appel_3: 0, sonnerie_5: 0 }, when: ["pas_d_appel"] }, // « Proposer d'ouvrir le dimanche »
  { id: "livret", kind: "jeu", after: { html: 35 }, when: ["pas_d_appel"] }, // le livret A, une fois les études commencées
  { id: "repas", kind: "jeu", after: { gants_poses: 35 } }, // « Se faire à manger »

  // Les achats, dans l'ordre où ils se proposent : chacun quand tu ne suis plus le restaurant (ou au plus tard LATE s après le précédent).
  { id: "gants", kind: "offre", earned: 1 }, // dès le premier euro, grisés jusqu'à 3 €
  { id: "eponge", kind: "offre", needs: ["gants"], when: ["a_la_traine"], fallback: { gants: LATE } },
  { id: "montre", kind: "offre", after: { eponge: 30 } },
  { id: "gants_pro", kind: "offre", needs: ["montre"], when: ["a_la_traine"], fallback: { montre: LATE } },
  { id: "eponge_pro", kind: "offre", needs: ["gants_pro"], when: ["a_la_traine"], fallback: { gants_pro: LATE } },
  { id: "douchette", kind: "offre", needs: ["eponge_pro"], when: ["a_la_traine"], fallback: { eponge_pro: LATE } },
  { id: "reparer", kind: "offre", needs: ["douchette"], when: ["a_la_traine"], fallback: { douchette: LATE } },
  { id: "joint", kind: "offre", needs: ["reparer"], when: ["a_la_traine"], fallback: { reparer: LATE } },
  { id: "panier", kind: "offre", needs: ["joint"], when: ["a_la_traine"], fallback: { joint: LATE } },
  { id: "detartrer", kind: "offre", needs: ["panier"], when: ["a_la_traine"], fallback: { panier: LATE } },
  { id: "pro", kind: "offre", needs: ["detartrer"], when: ["a_la_traine"], fallback: { detartrer: LATE } },
  { id: "detartrer_pro", kind: "offre", needs: ["gants_poses"], when: ["a_la_traine"], fallback: { gants_poses: LATE } },
  { id: "pro2", kind: "offre", needs: ["detartrer_pro", "deuxieme_restaurant"], when: ["a_la_traine"], fallback: { detartrer_pro: LATE } },
  { id: "adoucisseur", kind: "offre", needs: ["pro2"], when: ["a_la_traine"], fallback: { pro2: LATE } },

  // Les concessions : gratuites, refusables, de plus en plus grosses (tes mains, puis la machine, puis le client).
  { id: "approximatif", kind: "offre", after: { eponge_pro: 45 } },
  { id: "cycle_court", kind: "offre", after: { joint: 0 } },
  { id: "sans_relavage", kind: "offre", after: { grasses: 60 } },

  // Ce qu'un geste du joueur fait paraître aussitôt.
  { id: "jour", kind: "geste", after: { montre: 0 } }, // la montre donne le jour et le dimanche fermé
  { id: "machine", kind: "geste", after: { reparer: 0 } }, // le vieux lave-vaisselle et ce qu'il rapporte
  { id: "teaser", kind: "geste", after: { detartrer: 0 } }, // « Quand les machines tourneront seules… »
  { id: "poser_gants", kind: "geste", after: { pro: 0 } }, // « Poser les gants »
  { id: "etudes", kind: "geste", after: { gants_poses: 0 } }, // « Tes études » et l'énergie
  { id: "couverts", kind: "geste", when: ["demande_acceptee"] }, // les couverts, avec la première demande
  { id: "jours_ouverts", kind: "geste", when: ["dimanche_ouvert"] }, // le restaurant ouvre le dimanche
];

export const REVEAL_BY_ID: Record<string, RevealDef> = Object.fromEntries(REVEALS.map((r) => [r.id, r]));

// --- La banque ---
export const LIVRET_RATE = 0.01; // chaque lundi, 1 % du plus petit solde du livret dans la semaine (déposer le dimanche ne rapporte rien)

// --- Le cycle court et les assiettes grasses ---
export const CYCLE_COURT_MULT = 1.3; // +30 % d'assiettes pour le vieux lave-vaisselle (le pro a ses propres programmes)
export const LOAD_SECS = 10; // une fournée = 10 s de vieux lave-vaisselle en marche
export const GREASY_EVERY = 4; // en cycle court, une fournée sur quatre ressort grasse
export const RELAUNCH_SECS = 6; // une fournée grasse est relavée : le vieux lave-vaisselle ne sort rien pendant 6 s

// --- La vie ---
export const ENERGY_REGEN = 0.3; // énergie/s récupérée en continu (le repos, lent : on la regagne surtout en vivant)
export const MEAL_ENERGY = 10; // « Se faire à manger »
export const MEALS_PER_DAY = 2; // deux repas par jour
// Maman sonne tout le dimanche ; décrocher occupe la journée jusqu'à lundi (tout s'arrête sauf les machines), puis l'énergie est pleine.
export const WINDOW_IDLE_SECS = 20; // « Regarder par la fenêtre » : après 20 s sans rien faire
export const EMPTY_LABEL_SECS = 1.5; // pile vide depuis ce temps : le bouton l'annonce (évite qu'il clignote en cliquant vite)
export const PLONGE_OFFLINE_CAP = 600; // hors-ligne plafonné à 10 min au plongeur

// --- Équipement : objets uniques, chacun avec la statistique qu'il change ---
// Quand chacun se propose : voir REVEALS (les offres).
export interface EquipmentDef {
  id: string;
  cta: string;
  cost: number;
  dishesPerClick?: number; // fixe les assiettes lavées par clic (avant la concession « approximative »)
  oldRate?: number; // répare la vieille machine (assiettes/s)
  oldMult?: number; // multiplie la vieille machine seule (joint, panier, détartrage)
  proRate?: number; // ajoute un lave-vaisselle pro (assiettes/s)
  proMult?: number; // multiplie les lave-vaisselle pro déjà installés (un neuf n'a pas été détartré)
  machineMult?: number; // multiplie toutes les machines
  watch?: boolean; // la montre : affiche le jour, et le dimanche fermé
  note?: string; // précision ajoutée au sous-titre chiffré
  chef?: string; // réplique du chef à l'achat (id de CHEF_LINES)
}

export const EQUIPMENT: EquipmentDef[] = [
  { id: "gants", cta: "Acheter des gants de plonge", cost: 3, dishesPerClick: 2 },
  { id: "eponge", cta: "Acheter une vraie éponge", cost: 8, dishesPerClick: 3 },
  { id: "montre", cta: "S'acheter une montre d'occasion", cost: 15, watch: true },
  { id: "gants_pro", cta: "Acheter des gants professionnels", cost: 25, dishesPerClick: 4 },
  { id: "eponge_pro", cta: "Acheter une éponge professionnelle", cost: 40, dishesPerClick: 5 },
  { id: "douchette", cta: "Installer une douchette de prélavage", cost: 60, dishesPerClick: 6 },
  { id: "reparer", cta: "Réparer le vieux lave-vaisselle de la réserve", cost: 90, oldRate: 10, chef: "reparer" },
  { id: "joint", cta: "Changer le joint du vieux lave-vaisselle", cost: 120, oldMult: 1.5 },
  { id: "panier", cta: "Acheter un deuxième panier à vaisselle", cost: 200, oldMult: 1.5 },
  { id: "detartrer", cta: "Détartrer le vieux lave-vaisselle", cost: 300, oldMult: 1.5 },
  { id: "pro", cta: "Payer la moitié du lave-vaisselle pro", cost: 550, proRate: 40, note: "Le chef paie l'autre moitié.", chef: "investissement" },
  { id: "detartrer_pro", cta: "Détartrer le lave-vaisselle pro", cost: 250, proMult: 1.25 },
  { id: "pro2", cta: "Payer la moitié d'un deuxième lave-vaisselle pro", cost: 600, proRate: 40, note: "Le chef paie l'autre moitié.", chef: "investissement" },
  { id: "adoucisseur", cta: "Installer un adoucisseur d'eau", cost: 300, machineMult: 1.2 },
];

export const EQUIPMENT_BY_ID: Record<string, EquipmentDef> = Object.fromEntries(EQUIPMENT.map((e) => [e.id, e]));

// --- Les concessions : gratuites, et chacune rapporte un peu plus en lavant un peu moins bien ---
export interface ConcessionDef {
  id: string;
  cta: string;
  clickMult?: number; // multiplie les assiettes par clic (arrondi)
  cycleCourt?: boolean; // le vieux lave-vaisselle fait +30 %, une fournée du vieux sur GREASY_EVERY ressort grasse (et se relave)
  noRelaunch?: boolean; // les fournées grasses ne sont plus relavées : c'est le client qui paie
  note: string; // ce que ça coûte, écrit
}
export const CONCESSIONS: ConcessionDef[] = [
  { id: "approximatif", cta: "Ne passer qu'un coup d'éponge par assiette", clickMult: 1.2, note: "Elles sont un peu moins propres." },
  { id: "cycle_court", cta: "Programmer le lave-vaisselle en cycle court", cycleCourt: true, note: "Certaines assiettes ressortent grasses. Il les relave." },
  { id: "sans_relavage", cta: "Ne plus relaver les assiettes grasses", noRelaunch: true, note: "Elles partent en salle comme elles sont." },
];
export const CONCESSION_BY_ID: Record<string, ConcessionDef> = Object.fromEntries(CONCESSIONS.map((c) => [c.id, c]));

// --- Les demandes au chef : le joueur réclame lui-même plus de travail, au même tarif ---
export interface AskDef {
  id: string;
  cta: string;
  covers?: number; // couverts par jour ajoutés
  doubleCovers?: boolean; // double les couverts (un deuxième restaurant)
  sunday?: boolean; // ouvre le dimanche (Maman appelle alors en plein service)
  note?: string; // précision ajoutée au sous-titre chiffré (le prix de vie, écrit)
  chef?: string; // réplique du chef à l'acceptation
  needs?: string; // ne se propose qu'après cet événement (ex. : les gants posés)
}

export const ASKS: AskDef[] = [
  { id: "soir", cta: "Proposer au chef d'ouvrir le soir", covers: 40, chef: "plus_de_monde" },
  { id: "formule", cta: "Proposer une formule du midi à 12 €", covers: 50 },
  { id: "terrasse", cta: "Proposer d'installer une terrasse", covers: 60 },
  { id: "brunch", cta: "Proposer un brunch le samedi", covers: 70 },
  { id: "livraison", cta: "Proposer de s'inscrire sur une appli de livraison", covers: 100 },
  { id: "seminaires", cta: "Proposer de louer la salle pour des séminaires", covers: 130 },
  { id: "mariages", cta: "Proposer de faire traiteur pour des mariages", covers: 160, chef: "meilleure_chose" },
  { id: "petit_dejeuner", cta: "Proposer de servir le petit-déjeuner", covers: 120 },
  { id: "cantine", cta: "Proposer de faire la cantine de l'école d'à côté", covers: 140 },
  { id: "cars", cta: "Proposer d'accueillir les cars de touristes", covers: 160 },
  { id: "deuxieme_restaurant", cta: "Proposer d'ouvrir un deuxième restaurant juste à côté", doubleCovers: true, needs: "gants_poses", note: "Tu fais la plonge des deux." },
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

// Des prix de plus en plus chers : ce sont les améliorations du lave-vaisselle pro et les nouveaux couverts qui les paient.
export const LIBRARY: StudyItemDef[] = [
  { id: "html", cta: "Acheter un manuel de HTML d'occasion", cost: 60, name: "Manuel de HTML d'occasion", step: "Lire 10 pages", energy: 5, steps: 12, unit: "pages", perStep: 10, done: "Tu sais ce qu'est une balise. Ta première page web dit « Bonjour »." },
  { id: "cours", cta: "S'inscrire au cours du soir de la mairie", cost: 120, name: "Cours du soir de la mairie", step: "Aller au cours du soir", energy: 10, steps: 8, unit: "séances", perStep: 1, done: "Le prof dit que tu as un bon niveau." },
  { id: "js", cta: "Acheter un manuel de JavaScript", cost: 240, name: "Manuel de JavaScript", step: "Lire 10 pages", energy: 5, steps: 12, unit: "pages", perStep: 10, done: "Ton bouton change de couleur quand on clique dessus." },
  { id: "ordi", cta: "Acheter un ordinateur portable reconditionné", cost: 480, name: "Ordinateur portable reconditionné", step: "Faire un exercice", energy: 8, steps: 8, unit: "exercices", perStep: 1, done: "Il chauffe, mais il tient." },
  { id: "examen", cta: "S'inscrire à l'examen du cours du soir", cost: 960, name: "Examen du cours du soir", step: "Réviser l'examen", lastStep: "Passer l'examen", energy: 8, steps: 4, unit: "étapes", perStep: 1, requiresDone: "cours", done: "Reçu. 16 sur 20." },
];

export const LIBRARY_BY_ID: Record<string, StudyItemDef> = Object.fromEntries(LIBRARY.map((l) => [l.id, l]));

// --- Ce que dit le chef (canal périphérique : il euphémise, il ne commente jamais le joueur) ---
export const CHEF_LINES: Record<string, string> = {
  debut: "5 centimes l'assiette. En liquide.",
  banque: "Tu vides tes poches au guichet.",
  reparer: "Il marche ? Il reste au restaurant.",
  plus_de_monde: "Plus de monde, plus d'assiettes. Toujours 5 centimes l'assiette.",
  ta_mere: "Ta mère comprendra.",
  debordement: "Le chef a fait la plonge lui-même.",
  plainte: "Un client s'est plaint de la propreté de son assiette. Le chef l'a essuyée et l'a resservie.",
  investissement: "On dira que c'est un investissement.",
  gants_poses: "Tu la lances le matin et tu rentres. Toujours 5 centimes l'assiette.",
  meilleure_chose: "Tu es la meilleure chose qui soit arrivée à ce restaurant. Toujours 5 centimes l'assiette.",
  annonce: "Tes moitiés de machine ? Je les garde. Un investissement, on avait dit.",
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

  // Travail
  colWork: "Travail",
  dayClosed: (day: string) => `${day}, restaurant fermé`,
  noPlatesToday: "Pas d'assiette supplémentaire aujourd'hui.",
  pile: (n: N) => `Assiettes sales : ${n}`,
  pileWarn: (cap: N) => `Au-delà de ${cap}, le chef les lave lui-même.`,
  overflowToday: (n: N) => `Le chef en a lavé ${n} aujourd'hui.`,
  covers: (n: N) => `${n} couverts par jour`,
  wash: (n: number) => (n === 1 ? "Laver une assiette" : `Laver ${n} assiettes`),
  washEmpty: "Aucune assiette sale",
  washPhone: "Tu es au téléphone",

  // Lave-vaisselle
  machineTitle: "Lave-vaisselle",
  machineRate: (rate: string) => `${rate} assiettes / s`,
  relaunching: (secs: N) => `Le vieux lave-vaisselle relave une fournée grasse (${secs} s).`,
  free: "gratuit",

  // Sous-titres des achats
  upgradesTitle: "Améliorations",
  concessionsTitle: "Pour aller plus vite",
  perClick: (a: N, b: N) => `Par clic : ${a} → ${b} assiettes`,
  watch: ["Pour savoir quel jour on est", "Et quand le restaurant est fermé"],
  oldMachine: (a: string, b: string) => `Vieux lave-vaisselle : ${a} → ${b} assiettes / s`,
  proMachines: (a: string, b: string) => `Lave-vaisselle pro : ${a} → ${b} assiettes / s`,
  bothMachines: (a: string, b: string) => `Lave-vaisselle : ${a} → ${b} assiettes / s`,
  repairIncome: (euros: string) => `Il te rapporte ${euros} / min, même sans toi.`,
  incomeChange: (plural: boolean, a: string, b: string) => `${plural ? "Les lave-vaisselle te rapportent" : "Il te rapporte"} : ${a} → ${b} / min`,
  incomeCapped: "Pas plus : le restaurant ne salit pas plus d'assiettes.",
  proNoGreasy: "Le pro ne sort pas d'assiettes grasses.",
  noRelaunch: (a: string, b: string) => `Vieux lave-vaisselle : ${a} → ${b} assiettes / s en moyenne`,

  // Le chef
  chefTitle: "Le chef",
  askCovers: (a: N, b: N) => `Couverts par jour : ${a} → ${b}`,
  coverPlates: (n: number) => `1 couvert = ${n} ${pl(n, "assiette sale", "assiettes sales")}`,
  openDays: (a: N, b: N) => `Jours ouverts par semaine : ${a} → ${b}`,

  // La banque
  bankTitle: "La banque",
  livretCta: "Ouvrir un livret A",
  livretOpen: ["Un compte à part, qui rapporte chaque lundi", "Tu y mets ton argent quand tu veux, tu le reprends quand tu veux"],
  livretBalance: (euros: string) => `Livret A : ${euros}`,
  livretRule: (pct: N) => `Chaque lundi : +${pct} % du plus petit solde de la semaine`,
  livretLast: (euros: string) => `Lundi dernier : +${euros}`,
  deposit: "Tout mettre sur le livret",
  withdraw: "Tout reprendre",
  depositEffects: (euros: string, gain: string) => [`Livret A : +${euros}`, `Lundi dans une semaine : +${gain}`],
  withdrawEffects: (euros: string) => [`Argent : +${euros}`, "Il ne rapporte plus rien"],

  // Poser les gants, l'annonce
  poseGantsCta: "Poser les gants",
  poseGants: (rate: string, dirty: string) => `Les lave-vaisselle suivent seuls : ${rate} assiettes / s pour ${dirty} de vaisselle en moyenne.`,
  poseGantsStudies: "Te laisse du temps pour étudier.",
  annonceText: "Boulangerie Duval. Cherche quelqu'un pour faire notre site.",
  annonceCta: "Répondre à l'annonce de Mme Duval",
  annonceEffects: ["Tu quittes la plonge. Tu fais des sites, payés à la livraison."],

  // Ta vie
  colLife: "Ta vie",
  age: (n: N) => `${n} ans`,
  energy: (n: N, max: N) => `Énergie : ${n} / ${max}`,
  callRinging: "Maman appelle.",
  callAnswer: "Décrocher",
  callTalk: "Au téléphone jusqu'à lundi : tout s'arrête, sauf les machines",
  callEnergy: (a: N, b: N) => `Énergie : ${a} → ${b}`,
  callLoss: (euros: string) => `Pendant ce temps, le chef lave à ta place. Tu perds environ ${euros}.`,
  onPhone: "Tu es au téléphone avec Maman.",
  onPhoneLeft: (secs: N) => `Jusqu'à lundi : encore ${secs} s`,
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
