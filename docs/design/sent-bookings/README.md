# Propositions pour /sent-bookings

Cinq explorations visuelles mobiles générées avec le mode intégré `image_gen`, à partir de la capture fournie et de la logique de la page. Les prompts finaux sont conservés dans [prompts.json](prompts.json). Ces images sont des propositions de conception ; elles ne modifient pas l'application.

| Maquette | Intention UX |
| --- | --- |
| [01 — Carte compacte](01-carte-compacte.png) | Montrer trajet, statut et poids ; ouvrir les coordonnées et la référence dans les détails. Direction recommandée pour désencombrer la liste. |
| [02 — Liste épurée](02-liste-epuree.png) | Supprimer les cadres imbriqués et organiser les informations par la typographie. |
| [03 — Détails dépliables](03-details-depliables.png) | Afficher les informations secondaires à la demande. L'image montre l'état déplié. |
| [04 — Trajet vertical](04-trajet-vertical.png) | Rendre les villes et les pays lisibles sans troncature. Les deux points représentent le trajet, pas des étapes de suivi. |
| [05 — Fiche depuis le bas](05-fiche-actions-basses.png) | Conserver une liste compacte et consulter les détails dans une fiche mobile. L'image montre la fiche ouverte. |

## Principes pour une éventuelle implémentation

- Utiliser le logo existant et les composants de navigation du projet. Le logo de la première image présente une variation générée de couleur et de casse à ne pas reprendre.
- Donner la priorité au trajet et au statut, puis au nom du colis et au poids.
- Garder « Message » accessible pour contacter le voyageur. Le destinataire du colis est une personne distincte.
- Placer référence, horodatage complet et contact du destinataire dans les détails ; conserver copie et appel selon le type de contact.
- Rendre l'annulation accessible par un menu explicite ou une action secondaire, avec confirmation.
- Conserver les états en attente, acceptée, refusée, annulée et retirée. Une demande acceptée ne signifie pas que le colis est en cours de livraison.
- Prévoir zones tactiles d'au moins 44 px, contrastes suffisants, clavier et libellés accessibles lors de l'implémentation.

## Vérification

Les cinq images ont été examinées visuellement : trajet complet, statut textuel, poids et accès à la messagerie. Les variantes 03 et 05 montrent volontairement les détails ouverts. Les images restent des explorations graphiques ; le comportement interactif et l'accessibilité doivent être vérifiés sur une future implémentation.

Aucun code applicatif n'a été modifié. Les tests unitaires et fonctionnels ne s'appliquent pas à ces seuls PNG et documents.
