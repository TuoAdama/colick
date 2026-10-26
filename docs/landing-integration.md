# Landing Angular

La route `/` reprend la landing validée : « Expédiez vos colis avec des voyageurs de confiance », graisse 500, fond blanc, accents orange, photo circulaire locale et recherche prioritaire. La photo mesure 112 px sur mobile (96 px sur écran compact), 120 px sur tablette et jusqu’à 440 px sur desktop. La navigation connectée, les règles des modes commerciaux et le footer de l’application sont conservés.

## Lancer en local

Depuis `front-office/` :

```sh
npm ci
npm run start:local
```

Ouvrir http://localhost:4201/. Le proxy local utilise l’API déjà lancée sur http://localhost:8080. Le port 4201 évite le front Docker existant sur 4200. Le lancement Docker et `npm start` gardent leur configuration actuelle. Aucune modification CORS ou API n’est nécessaire.

## Comportement

- Un formulaire partagé conserve villes et date entre Envoyer et Voyager. Recherches via le routeur Angular vers `/search` ou `/parcel-search` ; date facultative, villes obligatoires, saisie libre autorisée et suggestions au clavier après 250 ms.
- Trois recommandations réelles au maximum, sans géolocalisation. Le pays est déduit du fuseau horaire connu ; il est omis sinon. Chargement, liste vide, erreur et Réessayer après échec ou délai de 8 s. Pas de données fictives.
- Un propriétaire ouvre la gestion de son trajet ; les autres utilisateurs ouvrent la réservation par référence avec `source=landing_recommended` et l’URL de retour. Les profils restent accessibles séparément.
- Animation d’entrée du titre et de la photo, dessin du trajet et vol unique de l’avion. Révélation des recommandations au scroll et parallaxe desktop. Les directives s’initialisent uniquement après le rendu navigateur et libèrent leurs observateurs et écouteurs à la sortie de la page. `prefers-reduced-motion` désactive les mouvements et laisse le contenu visible.

## Validation

```sh
npm test
npm run build
```

Tests Jasmine/Karma : recherches, champs obligatoires, conservation/inversion, annulation des suggestions obsolètes, sélection au clavier, navigation des cartes et profils pour visiteurs/propriétaires, flux vide/timeout/réessai, formatage réel et pays inconnu. Tests des animations : visibilité au scroll et au focus, réduction des mouvements et nettoyage à la destruction.

Contrôles navigateur : 320×568, 375×667, 768×1024, 1024×768, 1440×900 et 1920×1080 CSS, sans débordement et avec bouton visible à l’ouverture ; menu mobile/Escape, autocomplétion réelle Nantes, recherches dans les deux modes, profil Adama Tuo et détail de réservation Nantes–Abidjan. Aucune réservation soumise.

Le build respecte le seuil CSS bloquant de 8 ko. Le seuil d’avertissement de 4 ko signale la feuille de la landing ainsi que celle préexistante de gestion des trajets ; les budgets ne sont pas relevés.
