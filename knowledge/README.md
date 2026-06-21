# Base de connaissance — IdleGame

C'est la **mémoire du projet**. Pas un knowledge graph formel : un ensemble de **fiches courtes interconnectées**. Chaque fiche est un *nœud*, les liens entre fiches sont les *arêtes*. Lisible par un humain, versionné avec le code, sans outil à installer.

> 📐 **Le document de design consolidé (GDD v1)** vit dans [`docs/superpowers/specs/2026-06-21-idlegame-design.md`](../docs/superpowers/specs/2026-06-21-idlegame-design.md). Cette base de connaissance en est le *pourquoi* (principes, preuves, décisions) ; le spec en est le *quoi*.

## Pourquoi ça existe
1. **Ne pas re-déduire la recherche** à chaque session — elle est figée ici.
2. **Vocabulaire partagé** — quand on dit « principe de révélation progressive », on sait tous les deux de quoi on parle.
3. **Traçabilité** — le code pointera vers une décision, qui pointe vers un principe, qui pointe vers un jeu de référence.

## Mode d'emploi (le protocole)
- **Point d'entrée = ce README.** On commence toujours ici, on suit les liens.
- **Avant de concevoir/coder une feature**, on la relie à au moins un principe.
- **Toute décision se logge** dans le [journal des décisions](decisions/00-journal-decisions.md) au moment où on la prend, avec un lien vers le(s) principe(s) qui la justifient.
- **Fiches courtes.** On met à jour une fiche existante plutôt que d'en créer une qui double.
- **Si une fiche devient fausse**, on la corrige ou on la supprime. Une base obsolète est pire que pas de base.
- **Mise à jour pendant le travail**, jamais « plus tard ».

## La carte du graphe

### 🎯 Principes de design (le savoir durable, tiré de la recherche)
| Nœud | En une phrase |
|---|---|
| [01 · Révélation progressive](principes/01-revelation-progressive.md) | Démarrer avec presque rien ; l'interface se révèle et **embellit** au fil du jeu. |
| [02 · Un nouveau verbe par phase](principes/02-nouveau-verbe-par-phase.md) | À chaque palier, une **nouvelle mécanique**, pas juste un plus gros chiffre. |
| [03 · Courbes de coût & plaisir](principes/03-courbes-de-cout.md) | Coût ×1,15 vs production ×1,1 → le prochain achat est toujours à portée. |
| [04 · Prestige & reset](principes/04-prestige-reset.md) | Tout effacer contre un bonus permanent = moteur de rétention. |
| [05 · Twist narratif](principes/05-twist-narratif.md) | L'histoire recontextualise la boucle, racontée *dans* l'interface. |
| [06 · Rétention, hors-ligne, automatisation](principes/06-retention-hors-ligne-auto.md) | Progrès hors-ligne, auto des anciens clics, bonus aléatoires. |
| [07 · Pièges à éviter](principes/07-pieges-a-eviter.md) | Murs, pay-to-win, info-dump, tableur déguisé. |
| [08 · Rythme & pacing](principes/08-rythme-pacing.md) | Sessions ~8 min, cadence multi-horloges, viser une durée totale. |

### 📚 Références (les preuves)
| Nœud | Contenu |
|---|---|
| [Études de cas — jeux](references/etudes-de-cas-jeux.md) | Paperclips, Cookie Clicker, A Dark Room, Candy Box… et ce qu'on leur vole. |

### 🧩 Décisions (le savoir spécifique à NOTRE jeu)
| Nœud | Contenu |
|---|---|
| [Journal des décisions](decisions/00-journal-decisions.md) | Chaque décision datée, avec sa justification. |
| [Concept du jeu](decisions/01-concept-jeu.md) | Thème, histoire, ton, mécaniques — l'état courant du design. |

## Légende des liens
- **principe → référence** : « ce principe vient de ce(s) jeu(x) ».
- **décision → principe** : « ce choix de design applique ce principe ».
- **code → décision** *(plus tard)* : commentaire dans le code qui cite la décision implémentée.
