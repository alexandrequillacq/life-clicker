# Principe 03 · Courbes de coût & plaisir

**En une phrase :** le coût des achats grimpe plus vite que la production, de sorte que le *prochain* achat est **toujours** à quelques secondes/minutes. C'est la pompe à dopamine du genre.

## Les maths (valeurs par défaut éprouvées)
- **Coût : `prix = base × 1,15^n`** (n = quantité déjà possédée). Le prix double tous les ~5 achats.
- **Production : × ~1,1 par niveau** (sous-exponentiel). Comme le coût dépasse le revenu, le temps-avant-prochain-achat reste ~constant et court.
- **Seuil de perception : ~×1,2 (≈ +20 %)** — en-dessous, le joueur ne *sent* pas le progrès. D'où les multiplicateurs groupés entre 1,1 et 1,2.

### Les « paliers qui doublent » (milestones)
On pose des sauts discrets par-dessus la courbe lisse :
- Cookie Clicker : chaque upgrade d'un bâtiment **double** sa production.
- AdVenture Capitalist : le temps de cycle d'un business est divisé par 2 à **25/50/100/200/300/400** unités possédées.
- Antimatter Dimensions : ×2 tous les 10 achats → crée un micro-rythme « j'achète jusqu'au prochain multiple de 10 ».

Quand les générateurs produisent des générateurs, la croissance totale tend vers `e^x` → le fameux « mur de chiffres » qui grimpe vers la notation scientifique.

## Comment on l'applique à IdleGame
- Chaque source de revenu (jobs, employés, business) suit coût ×~1,15 / prod ×~1,1.
- Compétences = milestones qui **doublent** un revenu à des paliers (ex. niveau 5/10/25 d'une compétence).
- Garder les pas de progrès ≥ +20 % pour qu'ils se *sentent*.

## Connexions
- Vient de → [Cookie Clicker, AdVenture Capitalist, Antimatter Dimensions](../references/etudes-de-cas-jeux.md)
- Encadré par → [04 · Prestige & reset](04-prestige-reset.md) (le reset « ramène les chiffres à une taille gérable »)
- À calibrer avec → [08 · Rythme & pacing](08-rythme-pacing.md)
