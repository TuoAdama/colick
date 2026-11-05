Description du projet:

Ceci est une application permettant de mettre en place une plateforme de mise en relation de personnes voyageant et de personnes souhaitant transporter leurs colis d'un lieu à un autre grâce aux voyageurs. Par exemple, mettre en relation une personne qui part de Paris à Abidjan avec des personnes qui souhaitent envoyer des colis à Abidjan.

Donc voici les fonctionnalités à intégrer:
### Personne qui effectue un voyage doit avoir les fonctionnalités suivantes:
- Un formulaire permettant de définir les informations de voyage qui comprend:
	- L'adresse de départ
	- La destination
	- Le poids maximum qu'il est prêt à transporter
	- Le montant à payer par kilos
- Réception des demandes des personnes intéressées
- Possibilités de valider ou de rejeter une demande
- La liste des personnes ayant été acceptées.

### Personne qui souhaite envoyer un colis doit avoir les fonctionnalités suivantes:
- Un formulaire permettant définir ses recherches,  qui doit comprendre:
	- L'adresse de départ
	- La destination
	- Bouton recherche
- La recherche accepte une ville de départ seule, une destination seule ou les deux. La date facultative filtre les départs à partir du jour choisi ; au moins une ville est obligatoire. Les alertes nécessitent un départ et une destination.
- Le bouton « Voir tous les trajets » ouvre `/search?mode=all` : catalogue public des trajets actifs à venir avec des kilos disponibles, triés par départ le plus proche. Les filtres sont facultatifs et conservés dans l’URL, avec 20 résultats puis « Voir plus ».
- `GET /api/trips/catalog` accepte `departure`, `destination`, `date` (date minimale), `sort` (`departure_asc` par défaut, `price_asc`, `rating_desc`), `minPrice`, `maxPrice`, `page` (0 par défaut) et `size` (20 par défaut, de 1 à 100). La réponse contient `items`, `totalElements`, `page`, `size` et `hasNext`. Les égalités de tri sont départagées par identifiant croissant.
- Lister les résultats corresponds aux critères définis.
- Chaque résultats affichés doit comprendre:
	- Le départ
	- La destination
	- Le prix
	- Le poids maximum
	- Le nombre de kilos disponibles
    - Le nombre de voyageurs disponibles
    - L'avis de la personne qui a effectué le voyage
- Choix d'un résultat
- Soumission de la demande qui doit comprendre les informations suivantes:
	- Poids (optionnel)
	- Description détaillée
	- La photo du colis (optionelle)
- L'utilisateur peut réserver sa place. Le règlement dépend du mode commercial actif de la plateforme.
		Il existera deux types de réservation:
			- Instantanées: La demande passe automatiquement à accepter
			- Demande d'approbation: La demande doit être acceptée par le voyageur
- Toute demande doit faire l'objet d'envoie d'e-mail à la personne proposant le service
- Donner un avis sur un voyageur après le voyage



## Transaction
- Le mode commercial est contrôlé par `APP_COMMERCIAL_MODE` :
  - `FREE` (mode par défaut) : Coliclic ne prélève aucuns frais et ne gère pas le paiement ; le règlement est organisé directement entre les utilisateurs.
  - `COMMISSION` : Coliclic présente un paiement géré par la plateforme et applique une commission de 7 %.
- Dans les deux modes, le tarif au kilo reste fixé par le voyageur.
- Voir `docs/commercial-modes.md` pour la configuration et la procédure de bascule.

## Formulaire de création de compte:
Le formulaire de contact doit comprendre les champs suivants:
- Nom
- Prénom
- adresse e-mail
- Numéro de téléphone (optionnel)
- Mot de passe


## Administration (back-office)

L’espace `/admin/users` de l’application est réservé aux comptes ayant déjà le rôle
`ADMIN`. Il permet uniquement de consulter les comptes, de rechercher un utilisateur
par nom, prénom ou e-mail, puis de parcourir ses trajets publiés et ses réservations
envoyées, tous statuts confondus. Les listes sont paginées par 20 éléments.

Le statut « Vérifié » correspond à une adresse e-mail vérifiée. Les méthodes de
connexion indiquent les accès disponibles (Google, mot de passe ou les deux).
Les dates d’inscription reconstruites sont signalées comme estimées. Le champ
`users.updated_at` est ajouté par la mise à jour de schéma Hibernate existante :
il suit les modifications persistées du compte, et reste inconnu pour les anciens
comptes tant qu’ils ne sont pas modifiés. Aucun historique de modification n’est
reconstitué.

Les endpoints `GET /api/admin/users`, `/{id}`, `/{id}/trips` et `/{id}/bookings`
(suffixes relatifs à `/api/admin/users`) exigent le rôle `ADMIN`. Les listes acceptent
`page` (à partir de 0) et `size` (de 1 à 100, 20 par défaut) ; la liste des comptes
accepte aussi `q`. Les inscriptions et activités les plus récentes sont affichées
en premier, avec les dates inconnues en dernier.

- Possibilité de consulter les recherches qui ont été créées
- Interface pour afficher les demandes associées à une recherche
- Possibilité de consulter les infos qui ont été créées par les voyage




### Contrainte actuelle:
### Problème 1: 
	Possibilité de se faire voler des colis par de fausses annonces
	Solution:
		- Activation du compte par e-mail
		- Activation des comptes et système d'avis
			  
			  
			  

Technologies à utiliser:

- Tu utiliseras un monorepo
- Tu utiliseras docker compose
- Pour le front-end:
	- Angular pour le framework
	- Tailwindcss pour le style
- Pour le back-end:
	- Spring boot avec Java
	- Mysql pour la base de données
	- Redis pour le cache
- Mailer pour le testing des mails

## Vérifications des pull requests

Chaque pull request déclenche le workflow GitHub Actions `CI`, qui vérifie le
back-office, les tests front-office et le build front-office. Pour empêcher la
fusion d'une PR tant que la CI n'est pas verte, ajouter les checks suivants aux
règles de protection des branches GitHub :

- `backend-tests`
- `frontend-tests`
- `frontend-build`
- `commercial-config-check`

## Jeu de données de démonstration

Une fixture SQL PostgreSQL autonome fournit 100 comptes (dont deux administrateurs),
500 trajets et leurs réservations, avis, demandes de colis, messages et alertes.
Consulter [les instructions et comptes de démonstration](back-office/fixtures/README.md).
Son exécution est manuelle et transactionnelle : elle supprime les anciennes données
de la fixture puis recrée le jeu complet avec de nouveaux IDs positifs.
