# Validation de la refonte /trips

La page utilise une liste commune de billets sur mobile et ordinateur. L’en-tête
et la navigation partagés restent ceux de l’application. Les actions de gestion
sont distinctes du bouton d’ouverture des réservations. Le tarif au kilo est
conservé dans cette zone avec les statuts et compteurs de demandes.

## Vérifications

- Build de production réussi : `cd front-office && npm run build`.
- Tests unitaires et de composants : 608 réussis avec ChromeHeadless ; `cd front-office && npm test -- --watch=false`.
- Chrome avec des réponses API de démonstration interceptées localement : session,
  six trajets (actifs, terminé, annulé), demandes en attente, et une adresse longue.
- Largeurs 320, 390, 768 et 1440 px : cinq billets sur la première page, aucune
  troncature des villes et aucun débordement horizontal (contrôle des dimensions
  du document et de tous les éléments visibles de la page).
- Interactions navigateur : filtre Actifs, recherche combinée, résultat vide,
  pagination aller-retour, focus visible via Tab et Maj+Tab, ouverture des
  réservations avec Entrée. Aucune erreur JavaScript de page pendant ces scénarios.
- Les données de démonstration ne sont pas incluses dans le code applicatif.

## Captures

- [Mobile 320 px](trips-320.png)
- [Mobile 390 px](trips-390.png)
- [Tablette 768 px](trips-768.png)
- [Ordinateur 1440 px](trips-1440.png)

Les résultats des contrôles navigateur sont conservés dans
[visual-results.json](visual-results.json).
