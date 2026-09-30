# Chapitre 2 (freelance) : la suite

Prompt à coller dans une nouvelle session Claude Code, à la racine de life-clicker. Il se suffit à lui-même.

---

Le chapitre 2 de life-clicker (développeur freelance) est implémenté et mergé sur `main`. Lis d'abord :
- `CLAUDE.md`, pour les règles du projet (texte joueur en français, pas de tiret comme séparateur, l'énergie ne module que le clic, un challenger avant chaque changement de mécanique, puis TDD) ;
- la spec `docs/superpowers/specs/2026-09-27-refonte-progression-cynisme-design.md`, sections « Chapitre 2 détaillé : Freelance » (v1 à v5) et « Rythme mesuré » ;
- le plan `docs/superpowers/plans/2026-09-29-chapitre-2-freelance.md`, pour l'architecture.

Le moteur est dans `src/engine/freelance/` et le réglage dans `src/engine/content/freelance.ts`. L'écran est dans `src/ui/Freelance.svelte`. La sonde de rythme est dans `tests/rythme/freelance.ts` et `tests/freelance-rythme.test.ts`.

Commandes :
- tests : `node_modules/.bin/vitest run` (jamais `npm`) ;
- types : `node_modules/.bin/svelte-check --tsconfig ./tsconfig.json` ;
- build : `node_modules/.bin/vite build` ;
- serveur : `node_modules/.bin/vite --port 5173 --strictPort` en arrière-plan, puis http://localhost:5173/life-clicker/ et « 2. Freelance » dans le sélecteur « Chapitre » en haut à droite.

Garde-fous pour toute modification :
- les seuils de `tests/freelance-rythme.test.ts` ne s'élargissent jamais ;
- relance la sonde après chaque changement, car le test R7 (le net ne baisse pas après l'embauche de Nora) varie d'environ ±2 000 € au moindre changement d'ordre ;
- ne pousse sur `main` qu'avec mon accord.

## 1. Le bug à corriger en premier : un alt-tab remplit l'énergie

Quand une image met plus de 2 s à arriver (retour d'onglet, alt-tab, ralentissement), `advanceFrame` (dans `src/engine/offline.ts`, appelé par `src/main.ts`) fait passer l'écart par `applyOffline`. Or le hors-ligne du chapitre 2 remplit l'énergie à son maximum (`src/engine/offline.ts:26`, `state.energy = energyMax(state)`).

Conséquence, mesurée : l'énergie passe de 3 à 100 / 100 après 2,5 s hors de l'onglet, sans que le jour avance. La fatigue (un clic vaut moitié moins sous 40), les repas et les repas livrés (la graine du piège « automatiser sa vie ») se contournent par un simple alt-tab.

Correction proposée, à faire valider par le challenger avant de l'écrire :
- pendant une absence, l'énergie remonte au rythme du repos : `FL_ENERGY_REGEN` (0,3 / s) × secondes, plafonné à `energyMax` ;
- la recharge complète (le sommeil, comme au chapitre 1) n'a lieu qu'après une vraie absence, par exemple au moins `FL_OFFLINE_CAP` (600 s), ou au chargement de la page.

Tests à ajouter, en commençant par les voir échouer :
- `advanceFrame(s, 2.5, …)` fait gagner au plus 0,75 d'énergie ;
- une absence de 600 s remplit l'énergie ;
- le calendrier reste figé dans les deux cas.

## 2. Les modifications encore à faire

Chaque point est un choix de design à trancher avec moi avant de l'implémenter. Propose une recommandation pour chacun, puis on fait challenger et TDD, point par point.

1. **Les souvenirs de travail nourrissent le Sens.** `remember(..., false)` augmente `vieVecueTicks` pour la première facture (`src/engine/freelance/entreprise.ts`) et pour chaque déménagement (`src/engine/freelance/logement.ts`). La spec parle de « souvenir neutre », et une facture n'est pas un moment vécu. Piste : un souvenir neutre qui ne compte pas.
2. **L'IA qui répond à Maman a perdu sa condition.** La spec veut qu'elle se propose « un dimanche où au moins 5 bugs sont ouverts ». Aujourd'hui, elle se propose dès l'IA de la boîte mail (`src/engine/freelance/revelations.ts`, entrée `maman_ia`). À 2 clics / s, l'offre glisse aussi de deux dimanches : décrocher au premier tick coupe la sonnerie, et l'offre perd son créneau.
3. **Le fil des amis, spec v2.** Il manque trois choses :
   - le vrai coût sous « Y aller » (« Les bugs du vendredi attendront : −890 € lundi ») ;
   - « Énergie déjà pleine » à la place de « +40 » quand les repas sont livrés ;
   - « dans le salon de Sam » tant que tu dors sur son canapé.

   Voir `vueRendezVous` dans `src/engine/freelance/vue.ts`.
4. **Les ratios comptent depuis le début du chapitre**, pas depuis leur apparition (`vueVie` dans `vue.ts`). `mamanRings` compte aussi le dimanche qui sonne encore. La spec interdit un « 0 sur 3 » à l'arrivée et ne veut compter que les dimanches passés.
5. **L'économie de sortie est trop haute.** À la sortie, le net est de 6 500 à 12 400 € par semaine, contre environ 3 600 € dans la spec. Le chapitre 3 (studio, salaires de ~7 000 € par lundi en fin de chapitre) est calibré sur 3 600 €. Deux options : rééquilibrer le chapitre 2 (tailles, prix, commandes par semaine), ou recaler le chapitre 3 sur ces chiffres.
6. **Les logements ralentissent un peu.** Le joueur qui refuse tous les logements sort vers 14:20, contre 17:15 pour celui qui accepte, à cause du loyer. Un logement ne devrait jamais être un mauvais choix.
7. **Les marges R7 sont minces.** Le net après l'embauche de Nora ne dépasse celui d'avant que de +100 € à 6 clics / s en partant de −2 000 €. À 2 clics / s depuis −2 000 €, la marge est de +400 € et la sortie arrive à 28:20. Les livraisons arrivent par à-coups. Piste : comparer une moyenne de deux semaines, mais c'est un changement de test, à trancher.
8. **Refuser un outil pour toujours bloque encore la sortie.** Les outils forment une chaîne jusqu'à l'IA de la boîte mail, que la sortie exige. Chaque outil reste proposé, donc la sortie attend un achat mais ne se verrouille pas. Est-ce voulu ?
9. **Petites finitions**, sans enjeu de design :
   - `canEat` ne vérifie pas que « repas » est révélé, alors que l'interface le fait ;
   - le test « aucun tiret » ne vérifie que `TEXTES` et `KINDS`, pas les textes à trous ni les autres tables ;
   - les tests de `vueAmeliorations`, `vueClients`, `vueTopClients`, `vueSansToi`, `vueGagne`, `vueFinances`, `vueFin` et `vueSouvenirs` manquent au moteur ;
   - `hush()`, dans `tests/freelance.test.ts`, recopie les identifiants d'interface à la main au lieu de les lire dans `FL_REVEALS` ;
   - la ligne d'énergie s'affiche probablement deux fois sur l'onglet Perso.

Commence par le bug du point 1. Ensuite, présente-moi les points 1 à 8 de la section 2 avec une recommandation chacun, et attends mes choix. Le point 9 se fait sans me demander.
