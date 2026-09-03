# Validation de la refonte /search — issue #156

- Suite frontend Jasmine/Karma : 361 tests réussis avec ChromeHeadless.
- Build Angular de production (browser et SSR) : réussi.
- Contrôle Chromium aux largeurs 365, 390, 768 et 1280 px, hauteur 815 px : aucun débordement horizontal.
- Contrôle du résumé sous le header, des cartes mobiles et de la disposition desktop/tablette.
- Parcours navigateur : ouvrir le panneau depuis le bouton flottant, modifier le minimum, appliquer, vérifier `minPrice=7` dans l’URL, rouvrir depuis la barre et fermer avec Échap.
- Contrôle clavier : Maj+Tab depuis le bouton de fermeture ramène le focus sur Appliquer.

Les captures utilisent trois trajets fictifs injectés via interception HTTP dans le navigateur local. Elles valident le frontend ; aucune réservation réelle n’a été créée. Les parcours de réservation, alertes et états métier sont couverts par les tests de composants et services.

## Captures

- [Mobile 365 px](mobile-365.png)
- [Mobile 390 px](mobile-390.png)
- [Tablette 768 px](tablet-768.png)
- [Desktop 1280 px](desktop-1280.png)
- [Panneau de filtres](filters.png)

## Rejouer les vérifications

Depuis `front-office`, lancer `npm test -- --watch=false --browsers=ChromeHeadless` (définir `CHROME_BIN` si nécessaire), puis `npm run build`.

Pour le contrôle visuel, ouvrir `/search?from=Paris&to=Lyon&minPrice=5&maxPrice=20` avec des trajets disponibles, régler les quatre tailles indiquées, puis vérifier la modification de recherche, l’application et l’annulation des filtres, les bornes supprimables et les états de réservation.
