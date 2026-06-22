# Décors de logement (arrière-plans du jeu)

À partir du métier développeur, l'arrière-plan plein écran est le logement du joueur.
Il s'améliore au fil de la progression (voir `src/engine/content/homes.ts`).

## Comment mettre tes vraies photos

Dépose ici des images JPG avec **exactement** ces noms. Elles s'afficheront automatiquement
(aucune ligne de code à changer). Tant qu'un fichier manque, un dégradé de couleur sert de
placeholder pour ce niveau.

| Fichier            | Logement              | Étape de carrière         |
|--------------------|-----------------------|---------------------------|
| `sous-sol.jpg`     | Sous-sol (départ)     | développeur               |
| `logement.jpg`     | Premier logement      | développeur / lead dev    |
| `appartement.jpg`  | Appartement clair     | lead dev / CTO            |
| `loft.jpg`         | Loft                  | CTO                       |
| `maison.jpg`       | Maison avec jardin    | entrepreneur              |
| `villa.jpg`        | Villa avec piscine    | célébrité / politique     |

Conseils : format paysage, idéalement ~1920x1080 ou plus, fichiers raisonnables (< 500 Ko chacun
de préférence) pour garder le site léger. L'image est affichée en `cover` (recadrée pour remplir).

Ces fichiers sont servis à l'URL `/life-clicker/homes/<nom>.jpg` une fois déployés.
