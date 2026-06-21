# Journal des décisions

Chaque décision de design, datée, avec sa justification et un lien vers le(s) principe(s). On ajoute en haut (le plus récent d'abord). Format ADR léger.

---

## 2026-06-21 · Arbitrage rythme (2 couches) + Sens caché tôt + métiers concrets
**Arbitrage rythme (demandé par l'utilisateur, « pas trop vite pour les nouvelles mécaniques ») :** séparer **2 couches** — (1) contenu familier en flux rapide = tient le zéro-ventre-mou ; (2) nouvelles mécaniques **espacées et en solo** pour laisser le temps de se familiariser. Détail dans [08 · pacing](../principes/08-rythme-pacing.md). On arbitre **phase par phase**.
**Sens caché tôt :** le **Sens/Bonheur** n'est PAS un panneau à gérer au début ; il s'accumule en coulisse et n'est **révélé que lorsqu'il commence à se vider** (fin Acte II / Acte III). Allège la charge cognitive ET sert le twist. → [05 · twist](../principes/05-twist-narratif.md).
**Métiers concrets :** échelle de carrière proposée (plongeur → employé → cadre → PDG → star → politique → président → empereur). 🔲 À confirmer/ajuster avec l'utilisateur.
**Statut :** ✅ arbitrage & Sens-caché actés ; 🔲 métiers à confirmer.

## 2026-06-21 · Métiers confirmés + spec de design écrit
**Décision :** échelle de carrière **validée**, départ **plongeur** (« Laver une assiette »). Échelle complète : plongeur → employé de bureau → chef d'équipe/cadre → fondateur/PDG → icône médiatique → figure politique → président France/Monde → empereur de l'univers.
**Livrable :** spec de design complet écrit → [`docs/superpowers/specs/2026-06-21-idlegame-design.md`](../../docs/superpowers/specs/2026-06-21-idlegame-design.md). C'est le document de référence (GDD v1) ; cette base de connaissance reste le « pourquoi » derrière chaque choix.
**Statut :** ✅ spec écrit, en attente de relecture utilisateur avant le plan d'implémentation.
**Feedback utilisateur intégré :**
- 🚫 **Zéro ventre mou (règle cardinale)** : jamais 20 min sans rien. Un déblocage *en vue* en permanence → **micro-déblocages échelonnés à l'intérieur de chaque phase**, pas seulement aux transitions. Raffine [08 · pacing](../principes/08-rythme-pacing.md) & [07 · pièges](../principes/07-pieges-a-eviter.md).
- ⏱️ **Durée base recalibrée à ~2-3h** (tout avance vite, on évite les temps morts). **Tempo confirmé** : on démarre rapide, on pourra ajouter des modes plus lents ensuite.
- 👪 **Famille = volet parallèle** de l'axe Vie (rencontre → couple → enfants, au fil des actes), pas une phase. Gros contributeur de **Sens** ; la négliger/automatiser coûte cher → ancre émotionnelle du sacrifice.
- ⭐ **Ajout d'une phase « Célébrité »** entre Entrepreneur et Politique : charnière de ton (adoration grisante mais manufacturée — le beau qui sonne faux).
**Ordre des phases :** P0 boulot · P1 apprendre · P2 vrai job ‖ P3 manager · P4 empire · P5 **célébrité** ‖ P6 pouvoir/médias · P7 domination · P8 cosmique ‖ épilogue.
**Statut :** ✅ structure agréée ; reste à détailler mécaniques + UI par phase.
**Décision :** jeu **fini, soigné, ~3-5h**, avec une vraie fin + choix moral. New Game+ via **réincarnation**.
**Pourquoi :** finitude louée par les joueurs, colle au choix final, le plus réaliste à terminer pour un premier projet → [08 · pacing](../principes/08-rythme-pacing.md), [07 · pièges](../principes/07-pieges-a-eviter.md).
**Sous-décision (proposée) :** au lieu de **3 modes séparés** 1h/3h/5h (qui tripleraient l'équilibrage et dilueraient le slow-burn), un **réglage de tempo unique** (`Posé`/`Normal`/`Rapide`) = un coefficient de vitesse global sur le *même* contenu. Respecte la patience de chaque joueur sans fragmenter le récit.
**Statut :** ✅ durée actée ; 🔲 tempo à confirmer par l'utilisateur.
**Décision :** la vie est un **vrai axe mécanique** (option B). Ressource rare = temps/énergie répartie entre **Travail** et **Vie**. Les activités de vie rechargent une énergie qui **multiplie** le rendement.
**Thèse du jeu (cœur thématique) :** *optimiser/automatiser sa vie ne rend pas heureux.* On veut tous automatiser ce qui est chiant ; le jeu retourne ce réflexe contre le joueur. Automatiser le **travail** = sain ; automatiser la **vie** = piège séduisant qui vide le sens.
**Mécanique :** les activités de vie nourrissent (1) l'**énergie** (multiplicateur de rendement) ET (2) une valeur cachée **Sens/Bonheur**. Automatiser une activité **garde l'énergie** mais **coupe le Sens** (une vie automatisée n'est pas vécue). Le choix moral final pèse le Sens préservé contre la puissance brute accumulée.
**Pourquoi :** rend le sacrifice **émergent** (leçon de Paperclips) plutôt que raconté → [05 · twist](../principes/05-twist-narratif.md), [06 · automatisation](../principes/06-retention-hors-ligne-auto.md).
**Statut :** ✅ acté.

## 2026-06-21 · Ton = C (mélange progressif) + arc visuel en 3 actes
**Décision :** ton **C — mélange progressif**. Le jeu paraît simple/banal au début et devient de plus en plus dérangeant.
**Arc de l'interface en 3 actes** (raffine [01 · révélation progressive](../principes/01-revelation-progressive.md)) :
1. **Pauvre** → UI moche, terminal noir & blanc.
2. **Riche/aisé** → UI épurée, agréable, confortable (sommet du confort visuel).
3. **Mégalo** → UI **dystopique** : froide, grandiose, oppressante, un peu effrayante. Le beau bascule dans le malaise.
**Confirmé aussi :** la **« vie » qui s'efface** au fil de l'optimisation, et un **choix moral à la fin**.
**Pourquoi :** l'arc visuel et le glissement de ton portent le twist sans l'annoncer → [05 · twist narratif](../principes/05-twist-narratif.md).
**Statut :** ✅ acté.

## 2026-06-21 · Création de la base de connaissance
**Décision :** capturer la recherche dans une base de fiches markdown interconnectées (pas un knowledge graph formel). 
**Pourquoi :** ne pas re-déduire la recherche, vocabulaire partagé, traçabilité code→décision→principe. Un KG formel serait du sur-engineering pour un projet solo. 
**Statut :** ✅ fait.

## 2026-06-21 · Recherche initiale sur le genre idle
**Décision :** baser le design sur une deep research de 16 jeux + théorie. 
**Résultat :** 8 principes + études de cas (voir README). 
**Statut :** ✅ fait.

---

## Décisions OUVERTES (à trancher)
- ✅ ~~Ton du jeu~~ → **C (mélange progressif)**, acté le 2026-06-21.
- ✅ ~~« Vie » = vrai axe ?~~ → **oui, option B (temps/énergie + Sens caché)**, acté le 2026-06-21.
- ✅ ~~Durée totale~~ → **A : narratif borné, base ~2-3h + New Game+ (réincarnation)**, acté le 2026-06-21.
- ✅ ~~Tempo~~ → **confirmé** : réglage de vitesse global ; on démarre rapide, modes plus lents ensuite.
- ✅ ~~Structure de l'ossature~~ → **agréée** (9 phases + épilogue, famille parallèle, règle zéro ventre mou).
- 🔲 **Détail mécaniques + UI par phase** — prochaine grosse étape (deviendra le spec).
- 🔲 **Stack technique** (web/HTML-CSS-JS vs framework) — à traiter après le concept.
