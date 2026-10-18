# Trois variantes des cartes compactes

Propositions visuelles générées en mode intégré `image_gen` à partir de la maquette à cartes compactes sélectionnée. Aucun code applicatif modifié. Chaque carte représente un accès vers une page de détail distincte.

| Variante | Différence |
| --- | --- |
| [01 — Cartes denses](01-cartes-denses.png) | Cartes plus courtes et espacements réduits ; recommandée pour la simplicité. |
| [02 — Repères de statut](02-reperes-statut.png) | Fin liseré latéral correspondant au statut, en complément de son libellé. |
| [03 — Cartes et filtres](03-cartes-filtres.png) | Filtres Toutes, En attente et Acceptées ; Toutes sélectionné. |

Les trois variantes conservent les mêmes six demandes et leur ordre : Nantes–Abidjan / Poisson / 3 kg / Acceptée ; Paris–Dakar / Vêtements / 5 kg / En attente ; Lyon–Lomé / Livres / 2 kg / Acceptée ; Bordeaux–Cotonou / Chaussures / 4 kg / En attente ; Marseille–Douala / Documents / 1 kg / Refusée ; Lille–Bamako / Jouets / 2 kg / Annulée.

Palette demandée : marine `#023047`, cyan `#219EBC`, orange `#FB8500`, fond `#FAFAFA`, blanc, bordure `#E8E8EC`, vert `#10B981`, ambre `#F59E0B`, rouge `#EF4444`, gris pour Annulée. Utiliser les tokens et le logo natif lors d'une éventuelle implémentation ; les PNG sont des références graphiques.

Validation visuelle : six demandes complètes par image, villes lisibles, statuts textuels et chevrons présents, absence de contacts, références et actions secondaires. Signatures PNG et JSON vérifiés. Aucun test applicatif nécessaire pour ces seules images et leur documentation. Les prompts sont conservés dans `prompts.json`.
