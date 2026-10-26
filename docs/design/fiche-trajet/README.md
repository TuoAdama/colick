# Fiche trajet — maquettes mobiles et desktop

Maquettes exploratoires générées avec l’outil intégré imagegen le 26 octobre 2026. Données et portraits fictifs. Elles proposent la page consultée après sélection d’un résultat de recherche, avant le formulaire de réservation existant.

| Proposition | Intention | Image |
| --- | --- | --- |
| 1. Synthèse (recommandée) | Itinéraire, voyageur, capacité et tarif en cartes lisibles ; proche de l’existant. | [Maquette](01-synthese.png) |
| 2. Itinéraire | Parcours illustré puis détails pratiques. | [Maquette](02-itineraire.png) |
| 3. Voyageur | Profil et avis mis en avant avant le trajet. | [Maquette](03-voyageur.png) |
| 4. Tarif | Prix au kilo et exemple chiffré pour comprendre le coût du transport. | [Maquette](04-tarif.png) |
| 5. Compacte | En-tête contrasté, fiche continue et sections dépliables. | [Maquette](05-compacte.png) |

## Parcours proposé

Résultats de recherche → fiche trajet → bouton fixe « Réserver » → formulaire de demande existant.

Les informations centrales reprennent le modèle Trip : départ, destination, dates et horaires, prix par kilo, capacité restante, voyageur et avis. L’exemple montre un trajet nécessitant l’accord du voyageur ; pour un trajet instantané, adapter cette mention selon instantAcceptance. Le tarif et les éventuels frais doivent suivre le mode commercial actif, comme décrit dans le README racine.

## Lecture des images

Les images sont des intentions visuelles, pas des spécifications fonctionnelles. Les aéroports et illustrations sont des données d’exemple. Les illustrations et portraits diffèrent entre pistes. Dans la piste 4, la ligne « Type de colis acceptés » ajoutée par le générateur ne correspond pas à un champ du modèle actuel : l’omettre lors de l’implémentation. Dans la piste 5, les 15 kg représentent bien la capacité restante, pas le poids maximum initial. L’exemple 24 € pour 2 kg de la piste 4 représente le transport uniquement, sans préjuger des frais du mode commercial.

Aucun code applicatif modifié. Vérification visuelle des cinq images : trajet, horaires, prix, capacité, profil, avis et bouton « Réserver » présents. Les tests unitaires et fonctionnels ne s’appliquent pas à ces fichiers de conception statiques.

Les prompts complets sont conservés dans [prompts.json](prompts.json).

## Déclinaisons de la synthèse sur fond blanc

À la demande de l’utilisateur, trois éditions de la maquette 1 remplacent le fond bleu du bloc trajet par du blanc, en conservant le reste de la fiche et le bouton Réserver.

| Version | Traitement | Image |
| --- | --- | --- |
| Blanc 1 | Bordure fine, grandes icônes et liaison verticale. | [Maquette](06-blanc-bordure.png) |
| Blanc 2 | Séparateur horizontal et repère d’arrivée orange. | [Maquette](07-blanc-separateur.png) |
| Blanc 3 (recommandée) | Timeline légère et petits repères pour alléger le bloc. | [Maquette](08-blanc-timeline.png) |

Éditions réalisées avec imagegen intégré à partir de 01-synthese.png. Vérification visuelle : fond blanc, informations de départ et d’arrivée conservées, profil et bouton Réserver présents. De légères variations de rendu sont inhérentes aux images générées. [Prompts complets de ces trois éditions](prompts-fond-blanc.json).

## Cinq compositions desktop sur fond blanc

Adaptations de la version mobile Blanc 1 (06-blanc-bordure.png) avec imagegen intégré, une génération distincte par composition. Cible visuelle : viewport paysage 1440 × 1000 ; les dimensions natives des PNG peuvent légèrement différer. Les cartes restent blanches sur fond gris très clair, avec textes bleu profond et bouton orange. La navigation reprend les liens desktop existants.

| Version | Composition | Image |
| --- | --- | --- |
| Desktop 1 | Deux colonnes : trajet, profil et modalités à gauche, réservation à droite. | [Maquette](09-desktop-deux-colonnes.png) |
| Desktop 2 (recommandée) | Itinéraire horizontal en haut, profil et modalités dessous, réservation à droite. | [Maquette](10-desktop-itineraire-horizontal.png) |
| Desktop 3 | Trois colonnes : voyageuse, trajet et réservation. | [Maquette](11-desktop-trois-colonnes.png) |
| Desktop 4 | Grande fiche unifiée avec séparateurs, panneau de réservation distinct. | [Maquette](12-desktop-fiche-unifiee.png) |
| Desktop 5 | Composition horizontale et barre de réservation fixe en bas. | [Maquette](13-desktop-pleine-largeur.png) |

La version 2 utilise la largeur desktop pour une lecture immédiate du parcours, tout en maintenant une réservation visible. La version 1 est la plus proche de la structure mobile ; la version 4 réduit le nombre de cartes.

Validation visuelle : présence et lisibilité du trajet Paris → Abidjan, des dates du 12 novembre 2026, des horaires 10:30 et 17:00, d’Aminata K., de la note 4,9 et des 24 avis, des 15 kg disponibles, du prix de 12 €/kg, des modalités et du bouton Réserver. Le libellé Voyageuse de la version 4 a fait l’objet d’une correction ciblée. Les images restent des intentions visuelles : réutiliser le logo existant et ses couleurs exactes à l’implémentation. Aucun changement de code, d’API ou de comportement ; pas de tests applicatifs pour ces livrables statiques. [Prompts complets et correction](prompts-desktop.json).
