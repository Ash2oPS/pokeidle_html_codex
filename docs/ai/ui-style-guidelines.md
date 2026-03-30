# UI Style Guidelines

Ce document capture la direction generale du style UI du jeu.

Si une regle ici contredit `AGENTS.md`, `AGENTS.md` gagne.

## Goal

L'UI doit etre moderne, compacte, lisible, et clairement coherente avec l'identite Pokemon du jeu.

## Runtime Direction

- Direction cible: les UI runtime de gameplay doivent tendre vers une implementation JS canvas-first.
- Etat actuel: le repo contient encore des UI runtime en DOM/CSS. Ne pas pretendre que la migration est deja terminee.
- Ne cree pas de nouvelle UI runtime majeure en DOM/CSS sans raison technique explicite.
- Quand une UI existante reste temporairement en DOM/CSS, preserve sa parite fonctionnelle et prepare sa migration proprement au lieu d'empiler des rustines.

## Core Direction

- Vise un flat design moderne, propre et intentionnel.
- Garde une identite Pokemon visible dans la structure, la palette, les etats et les signaux visuels.
- Evite les interfaces generiques, fades, boueuses ou sans caractere.
- Evite aussi le patchwork visuel entre panneaux voisins.

## Visual Consistency

- Les surfaces, rayons, bordures, ombres et tailles doivent appartenir a une meme famille.
- Les cartes, boutons, tabs, pills, modales et panneaux doivent partager une logique de construction commune.
- N'introduis pas de reliquat d'un theme precedent dans un nouveau composant.
- Si un ecran commence a ressembler a une accumulation d'exceptions locales, prefere une remise a plat coherente plutot qu'une rustine de plus.

## Density And Hierarchy

- La compacite est une priorite forte tant que la lisibilite reste bonne.
- Les composants doivent etre petits par defaut. N'agrandis que ce qui merite vraiment plus de poids.
- Le contenu utile doit gagner de la place au premier ecran.
- Le chrome UI doit rester secondaire face au contenu actionnable.
- Le panneau d'information selectionne reste secondaire a la grille principale, sauf besoin de gameplay explicite.
- Les labels doivent etre courts et immediats.
- Supprime toute copy, helper text, badge ou compteur qui n'aide pas l'action en cours.

## Layout Rules

- Les interfaces de ce type doivent occuper tout l'ecran sur desktop comme sur mobile.
- Prefere des zones internes scrollables a une petite maquette centree qui gaspille l'espace.
- Les layouts doivent rester denses, stables et previsibles.
- Les etats importants doivent etre visibles sans surdecorer tout le reste.
- Aucun element important ne doit dependre d'une hauteur fixe si son contenu peut varier.
- Toute zone principale doit absorber des variations raisonnables de contenu sans casser la structure.
- Prefere `grid`, `flex`, `minmax()` et `clamp()` avec des tokens de taille coherents.
- Evite les largeurs et hauteurs hardcodees sauf besoin explicite de gameplay, de sprite ou de contrainte technique.
- Sur mobile plein ecran, tiens compte des safe areas et du viewport dynamique.

## Grouping And Separation

- Les elements lies doivent etre plus proches entre eux que des elements non lies.
- Les elements non lies ne doivent jamais sembler appartenir au meme groupe par erreur de proximite, d'alignement ou de fond partage.
- Aucun element non lie ne doit se superposer a un autre.
- Un overlay, un badge flottant ou une decoration absolue n'a de valeur que si sa position reste robuste a toutes les tailles cibles.

## Component Rules

- Centre proprement le contenu des boutons, tabs, chips et cartes cliquables.
- Les alignements doivent etre francs. Evite tout contenu qui flotte visuellement dans son conteneur.
- Utilise les accents forts pour de vrais etats:
  - selection
  - focus
  - indisponible
  - progression importante
- Garde les etats non actifs plus calmes.

## Color And Material

- Prefere des surfaces plates et des ombres retenues.
- Garde un contraste net entre fond, surface, contenu et etat actif.
- Utilise une palette controlee avec peu d'accents forts mais bien places.
- Evite:
  - gradients boueux
  - chrome inutile
  - decorations qui n'aident pas la hierarchie
  - surcouche visuelle parasite

## Mobile Rules

- Sur mobile, l'UI doit garder la meme famille visuelle que sur desktop.
- La version mobile ne doit pas etre une simple version desktop ecrasee.
- Le panel d'information du Pokemon selectionne ne doit pas voler de la hauteur a la grille sans raison.
- Quand ce panel existe sur mobile, il doit etre plus court que sa version desktop.
- Quand pertinent, place:
  - sprite + nom + types a gauche
  - stats et infos secondaires a droite
- Avant de tout miniaturiser, restructure le layout pour gagner de l'espace intelligemment.
- Les cibles tactiles doivent rester fiables meme dans une UI compacte.

## Basic UI Safety Rules

- Toute UI doit rester lisible, non coupee, non chevauchee et fonctionnelle sur desktop et mobile portrait.
- Aucun texte essentiel ne doit etre trop petit, trop serre ou perdu dans le decor.
- Toute variation raisonnable de texte, de compteur, d'etat ou de langue doit rester propre visuellement.
- Le contenu utile doit rester prioritaire sur le chrome UI.
- Une interface dense doit montrer plus de contenu utile, pas juste tout rendre plus petit.
- Une UI n'est pas validee parce qu'elle est belle en capture statique: elle doit aussi rester stable et robuste en vrai.

## Canvas UI Rules

- Une UI canvas doit garder la meme exigence de lisibilite, de compacite et de coherence qu'une UI DOM/CSS.
- Le rendu canvas doit rester net avec un device pixel ratio gere correctement.
- Les hitboxes, zones de survol, focus et selections doivent correspondre aux positions visuelles reelles.
- Le layout canvas doit etre pilote par des regles de placement claires, pas par des coordonnees magiques dispersees.
- Une migration vers canvas doit conserver les informations utiles, les etats et les interactions de l'UI remplacee avant d'ajouter des raffinements visuels.

## Validation Checklist

- Verifie le rendu desktop et mobile avec screenshots relus.
- Verifie que l'interface remplit bien l'ecran cible.
- Verifie que la densite gagne vraiment de la place utile.
- Verifie que les composants interactifs restent centres, lisibles et coherents entre eux.
- Verifie qu'aucun composant ne semble provenir d'une ancienne direction visuelle.
- Verifie qu'aucun texte n'est coupe et qu'aucun element non lie ne se chevauche.
- Verifie que la version mobile est restructuree proprement et pas juste compressee.
- Si l'UI touche du canvas ou une grille virtualisee, verifie aussi la nettete, les hitboxes et la densite reelle.
