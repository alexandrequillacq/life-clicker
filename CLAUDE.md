# life-clicker

Jeu idle/narratif borné (~2-3h) : du plongeur à l'empereur cosmique. Thèse : **automatiser le TRAVAIL est sain et célébré ; automatiser sa VIE est le piège qui vide le Sens**. L'esthétique évolue par actes (Acte I blanc minimal facon Paperclips → Acte II beau et coloré → Acte III froid et dystopique).

Stack : Svelte 5 (runes) + Vite + TypeScript. Moteur pur testable dans `src/engine/` (zéro import Svelte), UI dans `src/ui/`. Décimaux via break_infinity.js.

## Règle de process (IMPORTANTE)

**À chaque modification des mécaniques ou des actions, spawn un subagent qui challenge la décision et sa cohérence AVANT d'implémenter.** Le but : éviter de dégrader le système dans son ensemble (soft-lock, incohérence de métaphore, déséquilibre, dérive de la thèse). Le subagent reçoit l'état actuel + le changement proposé, et rend une critique priorisée + des nombres concrets + un go/no-go. On implémente ensuite en TDD.

## Règles de game design (contraintes dures)

- **Tout le texte joueur est en français.**
- **Jamais de tiret long (—) ni court (–) comme séparateur** dans le texte joueur ; la séparation se fait par l'interface/la mise en page. Les traits d'union orthographiques ("Lave-vaisselle") sont OK.
- **Chaque mécanique doit être cohérente avec sa métaphore réelle.** Ex. : l'énergie ne module QUE les actions actives du joueur (le clic), jamais le revenu passif des machines ou de l'IA (une machine ne se fatigue pas).
- **Monnaie unique : €** (plus les followers en phase célébrité).
- Automatiser sa vie creuse le Sens (graine du piège, célébrée et jamais commentée) ; acheter un meilleur logement n'est PAS automatiser sa vie.

## Workflow par phase

design → subagent challenger → implémentation TDD (tests moteur + un test DOM) → vérif (build + suite) → commit + push sur `main`. Le push redéploie GitHub Pages (~40s) ; le hash du commit s'affiche discrètement en haut à droite du jeu pour vérifier que le déploiement est à jour.

Lancer en local : `node_modules/.bin/vite` → http://localhost:5173/life-clicker/ (le wrapper `npm` plante sur un bug sandbox macOS `uv_cwd`).
