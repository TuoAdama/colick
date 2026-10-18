# Cinq maquettes — Détail d'une demande envoyée

Explorations mobiles générées avec le mode intégré `image_gen`, dans la continuité des cartes compactes retenues pour la liste. Il s'agit de pages de détail autonomes, avec retour à la liste, sans modification de l'application.

| Maquette | Intention |
| --- | --- |
| [01 — Fiche épurée](01-fiche-epuree.png) | Sections simples et séparateurs, sans conteneurs multiples. |
| [02 — Sections compactes](02-sections-compactes.png) | Trois cartes : trajet, colis, voyageur et tarif. Recommandée pour prolonger le langage visuel de la liste. |
| [03 — Trajet vertical](03-trajet-vertical.png) | Villes et horaires organisés verticalement pour faciliter la lecture. |
| [04 — Récapitulatif](04-recapitulatif.png) | Une fiche unique regroupant les informations avec des séparateurs. |
| [05 — Voyageur et actions](05-voyageur-actions.png) | Voyageur placé plus haut et barre d'actions prévue en bas de l'écran. |

## Données fictives communes

Demande Poisson, acceptée, référence TRK-05-15, créée le 18 octobre 2026 à 09:47. Trajet Nantes (France) → Abidjan (Côte d'Ivoire), départ prévu le 22 octobre à 10:00, arrivée prévue le 23 octobre à 18:00. Colis de 3 kg, description « Colis emballé avec soin. », destinataire tuoadama17@gmail.com. Voyageur Amadou K., avatar AK, note 4,8 pour 12 avis. Tarif 10 €/kg, montant estimé 30 €, règlement à convenir avec le voyageur, correspondant au mode FREE par défaut documenté dans le README du projet.

Une action principale ouvre la messagerie du voyageur ; l'annulation est secondaire. Le destinataire du colis est distinct du voyageur. Le tracé entre les villes représente le trajet, pas une progression de livraison. Les données de voyageur, horaires et tarif sont des exemples graphiques.

## Palette et limites des propositions

Marine `#023047`, cyan `#219EBC`, orange `#FB8500`, fond `#FAFAFA`, blanc, bordure `#E8E8EC`, vert `#10B981`, rouge `#EF4444`. Poppins demandé dans les prompts. Utiliser les tokens et le logo natif pour toute future implémentation.

Les cinq images ont été examinées : trajet et villes complets, destinataire distinct du voyageur, statut textuel, montant cohérent (3 × 10 = 30 €), retour à la liste et une seule action de messagerie. Les variantes 01 et 02 répètent le montant sur le calcul et sur le total ; cette répétition pourra être simplifiée. La variante 01 omet l'ajout facultatif de photo, présent dans les quatre autres. Dans la variante 05, la position fixe de la barre est une intention de conception à valider sur une future interface interactive.

Signatures PNG et JSON des prompts vérifiés, ainsi que `git diff --check`. Aucun test unitaire ou fonctionnel applicatif exécuté pour ces seuls livrables graphiques. Les prompts exacts sont conservés dans `prompts.json`.
