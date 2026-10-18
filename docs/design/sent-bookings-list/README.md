# Cinq maquettes de liste — Demandes envoyées

Ces propositions remplacent l'approche de grandes fiches par une liste de demandes compactes. Elles sont générées en mode intégré `image_gen`, sans modification de l'application. Chaque ligne représente un lien vers la page existante `/sent-bookings/:tripId/:bookingId` ; les images ne sont pas interactives.

| Proposition | Intention |
| --- | --- |
| [01 — Liste à séparateurs](01-liste-separateurs.png) | Liste sobre sans cartes ; direction recommandée pour lire rapidement plusieurs demandes. |
| [02 — Cartes compactes](02-cartes-compactes.png) | Séparer visuellement les demandes par de petites cartes de deux lignes. |
| [03 — Liste avec onglets](03-liste-onglets.png) | Proposer Toutes, En attente et Acceptées ; montrer Toutes sélectionné. |
| [04 — Liste chronologique](04-liste-chronologique.png) | Regrouper les demandes sous Aujourd'hui, Hier et Plus anciennes. |
| [05 — Boîte de réception](05-boite-reception.png) | Petites icônes de colis, lignes compactes et chevrons vers les détails. |

## Contenu et navigation

Les cinq écrans partagent les six demandes fictives suivantes, dans le même ordre :

| Trajet | Colis | Poids | Statut |
| --- | --- | --- | --- |
| Nantes → Abidjan | Poisson | 3 kg | Acceptée |
| Paris → Dakar | Vêtements | 5 kg | En attente |
| Lyon → Lomé | Livres | 2 kg | Acceptée |
| Bordeaux → Cotonou | Chaussures | 4 kg | En attente |
| Marseille → Douala | Documents | 1 kg | Refusée |
| Lille → Bamako | Jouets | 2 kg | Annulée |

Seuls trajet, colis, poids, statut et chevron figurent sur chaque ligne. Coordonnées, référence, messagerie et annulation sont réservées à la page de détail. Aucun panneau dépliable ni fenêtre superposée. La variante chronologique ajoute uniquement des libellés de groupe.

## Direction graphique

Les prompts demandent Poppins, bleu marine `#023047`, cyan `#219EBC`, orange `#FB8500`, fond `#FAFAFA`, surfaces blanches, bordures `#E8E8EC`, vert `#10B981`, ambre `#F59E0B` et rouge `#EF4444`. Le logo conserve Coli orange et clic marine. Les statuts comportent toujours un libellé.

Les images générées sont des références visuelles : lors d'une éventuelle implémentation, utiliser les tokens exacts et le logo natif du projet plutôt que prélever des couleurs ou du texte dans les PNG. Le format commun demandé est 1024 × 1792 ; les dimensions réelles sont consignées dans `validation.json`.

## Validation

Contrôle visuel effectué : six demandes entièrement visibles par écran, six demandes identiques dans le même ordre, villes non tronquées, statut textuel et chevron par ligne, aucun bouton Message ou Annuler ni contact sur la liste. Les cinq PNG ont les mêmes dimensions réelles de 948 × 1659 pixels. Les prompts finaux sont enregistrés dans `prompts.json` et les vérifications dans `validation.json`.

Aucun code applicatif, API ou modèle modifié. Les tests unitaires et fonctionnels applicatifs ne s'appliquent pas à ces seuls livrables graphiques. Les fichiers PNG, le JSON et le diff sont vérifiés avant livraison.
