# Validation de la refonte /trips

La page utilise une liste commune de billets sur mobile et ordinateur. L’en-tête
et la navigation partagés restent ceux de l’application. Les actions de gestion
sont distinctes du bouton d’ouverture des réservations. Sur mobile, elles sont
repliées derrière le bouton à trois points du billet et peuvent être ouvertes au
clavier. Sur ordinateur, elles restent affichées comme dans la première version.
Le tarif au kilo, les statuts et les compteurs de demandes restent accessibles
dans cette zone.

## Vérifications

- Build de production réussi : `cd front-office && npm run build`.
- Tests unitaires et de composants : 610 réussis avec ChromeHeadless ; `cd front-office && npm test -- --watch=false`.
- Chrome avec des réponses API de démonstration interceptées localement : session,
  six trajets (actifs, terminé, annulé), demandes en attente, et une adresse longue.
- Largeurs 320, 390, 768 et 1440 px : cinq billets sur la première page, aucune
  troncature des villes et aucun débordement horizontal (contrôle des dimensions
  du document et de tous les éléments visibles de la page).
- Interactions navigateur : filtre Actifs, recherche combinée, résultat vide,
  pagination aller-retour, focus visible via Tab et Maj+Tab, ouverture des
  réservations avec Entrée. Aucune erreur JavaScript de page pendant ces scénarios.
- Les données de démonstration ne sont pas incluses dans le code applicatif.

## Correction mobile après comparaison à la maquette

- Suppression du bouton retour dans l’en-tête de contenu mobile ; le dashboard
  reste accessible depuis la navigation partagée et le lien desktop est conservé.
- Ajustement des marges, du titre, du bouton principal et des filtres pour retrouver
  les proportions de la maquette.
- Date ramenée à 30 px (28 px à 320 px), trajet à 14 px (12 px à 320 px), séparation
  pointillée et ligne des métadonnées resserrées avec capacité turquoise.
- Barre d’actions masquée par défaut sur mobile, accessible avec un bouton séparé
  et `aria-expanded`/`aria-controls` ; fermeture lors d’un changement de filtre,
  recherche ou page. Contrôle navigateur de l’ouverture/fermeture et de la visibilité
  permanente des actions sur desktop.
- Comparaison de la capture desktop à 1440 px : dimensions identiques ; seuls trois
  pixels diffèrent d’un niveau de couleur (anticrénelage), aucune différence de mise
  en page observée.
- Le build reste réussi, avec un avertissement de budget de style du composant
  (environ 5,5 kB pour un seuil d’avertissement de 4 kB ; seuil bloquant de 8 kB).

## Captures

- [Mobile 320 px](trips-320.png)
- [Mobile 390 px](trips-390.png)
- [Tablette 768 px](trips-768.png)
- [Ordinateur 1440 px](trips-1440.png)

Les résultats des contrôles navigateur sont conservés dans
[visual-results.json](visual-results.json).
