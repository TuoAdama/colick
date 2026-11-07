# Contexte produit vérifié

Source métier : `readme.md` à la racine, branche `preprod`, base `94ada60`.

Coliclic est une plateforme de **mise en relation** entre les expéditeurs et les voyageurs disposant de place dans leurs bagages. Le voyageur définit son départ, sa destination, les kilos proposés et son tarif au kilo. L’expéditeur recherche un trajet, consulte le profil et les avis, décrit son colis et soumet une demande. Le voyageur peut accepter ou rejeter cette demande. La messagerie permet ensuite d’organiser la remise.

En mode `FREE`, Coliclic ne gère pas le paiement ; le règlement s’organise directement entre les utilisateurs. Le mode `COMMISSION` existe également. Le film ne présente aucune étape de paiement et reste fidèle au parcours dans les deux modes, sans présumer la configuration déployée.

Écrans et ressources examinés :

- `front-office/src/app/pages/how-it-works/how-it-works-page.component.html`
- `front-office/src/app/pages/search/search-page.component.html`
- `front-office/src/app/pages/trip-detail/trip-detail-page.component.html`
- `front-office/src/app/pages/booking-request/booking-request-page.component.html`
- `front-office/src/app/shared/components/booking-request-form/booking-request-form.component.html`
- `front-office/src/app/pages/messages/messages-page.component.html`
- `front-office/src/app/components/header/header.component.html`
- `front-office/src/app/components/header/header.component.css`
- `front-office/src/styles.css` et `front-office/tailwind.config.js`
- `docs/trips-ticket-redesign/trips-390.png`
- `mockup/logo.svg`
- Film horizontal existant sur la branche `feat/no-issue-colick-presentation-video` : `docs/presentation-video/README.md`, `film.json`, `render.py` et tests.

L’interface du film est une simplification illustrée des écrans, pas une capture d’une session. Sam, Aya, Léa, le profil secondaire Marc, la description du colis et les échanges sont fictifs. La mention de démonstration est affichée pendant les deux séquences d’interface.

Aucun montant, poids disponible, note, nombre d’avis, statistique, promotion, garantie, assurance ou délai n’est inventé. Les trois critères de choix sont nommés et mis en évidence sans en simuler la valeur. Les coches indiquent les critères consultés, pas une certification du voyageur. La réception illustre une remise humaine, sans promettre une garantie de livraison. La carte est un passage narratif et ne propose aucun suivi GPS.

Police redistribuée : DM Sans, dépôt officiel Google Fonts, `ofl/dmsans/DMSans[opsz,wght].ttf`, accompagnée du fichier `OFL.txt`. Cette famille est déjà déclarée et utilisée par les pages de l’application. Tous les autres éléments visuels et sonores sont générés par les sources livrées.
