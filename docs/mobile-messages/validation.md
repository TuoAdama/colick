# Validation de la messagerie mobile

La conversation reprend la maquette validée sans pièce jointe sous 768 px. L’en-tête de l’espace connecté est conservé. Les noms, trajets, messages et dates des captures sont des données de test, interceptées uniquement par le navigateur de validation.

## Vérifications

- Suite front-office Jasmine/Karma : `npm test`, 594 tests réussis.
- Build de production : `npm run build`, réussi.
- Chrome, largeurs 320, 390, 767, 768 et 1280 px : aucun débordement horizontal. Sur mobile, le champ de saisie reste dans la fenêtre et le pied de page est masqué ; le pied de page et la disposition desktop sont conservés à partir de 768 px.
- Conversation ouverte directement avec `conversationId`, retour à la liste, trajet long sur plusieurs lignes, historique de 40 messages et absence d’erreurs JavaScript.
- Ouverture sur le dernier message après chargement des styles/polices ; conservation de la position de lecture pendant un cycle de polling.
- Fenêtre réduite à 320 × 480 avec le champ focalisé : saisie visible. Cela simule la réduction d’espace disponible ; ce contrôle ne remplace pas un essai du clavier natif sur iOS et Android.

## Reproduire les contrôles navigateur

Après le build, lancer `node docs/mobile-messages/validate.cjs` depuis la racine avec Playwright et Chrome disponibles. Si Playwright n’est pas dans la résolution Node habituelle, fournir le chemin du module via `PLAYWRIGHT_MODULE`. Le script sert le build sur un port local éphémère, intercepte les API avec des données fictives, effectue les assertions et actualise les captures de ce dossier. Il ne contacte pas le back-office.

## Captures

- [Mobile 320 px](messages-320.png)
- [Mobile 390 px](messages-390.png)
- [Mobile 767 px](messages-767.png)
- [Seuil desktop 768 px](messages-768.png)
- [Desktop 1280 px](messages-1280.png)
- [Trajet et historique longs](messages-long-320.png)
- [Fenêtre réduite, champ focalisé](messages-reduced-viewport-320.png)
