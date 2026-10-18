# Liste Messages sur mobile

La liste reprend la maquette validée sous 768 px : fond blanc, compteur total orange, recherche locale, lignes séparées sans carte ni ombre. Le menu et le profil partagés sont conservés. Les horaires sont volontairement omis : l’API ne fournit pas la date du dernier message.

La recherche porte sur le nom, le trajet affiché et le dernier message, sans tenir compte de la casse ni des accents. Le compteur indique toujours le total des conversations. Les états chargement, erreur, liste vide et recherche sans résultat sont distincts. L’ouverture du détail et le retour à la liste sont conservés.

## Validation

- Tests Angular Jasmine/Karma : 598 tests réussis, dont les nouveaux scénarios de recherche, compteur, aperçu vide, non-lus, ouverture et retour, chargement et erreur.
- Build de production réussi, sans dépassement du budget CSS du composant.
- Chrome Headless : largeurs 320, 390, 767, 768 et 1280 px. Aucun débordement horizontal ni erreur JavaScript ; recherche et compteur présents uniquement sur mobile, disposition desktop conservée.
- Contrôles fonctionnels : recherche insensible à la casse et aux accents, recherche sans résultat, compteur stable, ouverture et retour, liste de 25 conversations, nom sans espaces et trajets longs, défilement et états vide/erreur.
- Les API sont interceptées par les scripts de validation avec des données fictives ; aucun compte réel n’est modifié.

## Reproduire

Depuis `front-office`, exécuter `npm ci`, `npm test -- --watch=false`, puis `npm run build`. Depuis la racine, exécuter `node docs/mobile-messages/validate-list.cjs` pour la liste et `node docs/mobile-messages/validate.cjs` pour le détail. Playwright et Chrome doivent être disponibles ; `PLAYWRIGHT_MODULE` peut désigner le chemin du module Playwright.

## Captures de la liste

- [320 px](list-320.png)
- [390 px](list-390.png)
- [767 px](list-767.png)
- [768 px](list-768.png)
- [1280 px](list-1280.png)
- [Contenu long, 320 px](list-long-320.png)
