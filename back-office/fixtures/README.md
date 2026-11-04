# Fixture de démonstration PostgreSQL

`demo.sql` charge un jeu fictif dans une base de développement ou de démonstration
PostgreSQL 16 dont le schéma a déjà été initialisé par cette version du backend.
Il ne crée pas le schéma applicatif, ne requiert aucune extension et n'est jamais
exécuté automatiquement au démarrage. Aucun e-mail ni SMS n'est envoyé.

Depuis la racine du dépôt, avec `psql` et une URL de connexion configurée :

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f back-office/fixtures/demo.sql
```

Avec la base locale de Docker Compose, après démarrage du backend pour initialiser le schéma :

```sh
docker compose exec -T postgres sh -c 'exec psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < back-office/fixtures/demo.sql
```

Dans un client SQL, sélectionner la base et le schéma applicatif, activer l'autocommit,
puis exécuter le fichier entier, y compris `BEGIN` et `COMMIT`. Ne pas utiliser
`psql --single-transaction` : le script gère sa transaction. En cas d'erreur dans
un client interactif, exécuter `ROLLBACK` avant de réessayer.

## Comptes

Tous les comptes utilisent le mot de passe **`ColiclicDemo2026!`**, stocké en BCrypt.
Les adresses sont fictives et les numéros de téléphone sont laissés vides.

| Comptes | Rôle et état |
| --- | --- |
| `aicha.kone@example.test`, `thomas.martin@example.test` | ADMIN, actifs et vérifiés |
| Profils 3 à 80 du catalogue | USER, actifs et vérifiés, voyageurs/expéditeurs |
| Profils 81 à 90 du catalogue | USER, actifs mais e-mail non vérifié |
| Profils 91 à 100 du catalogue | USER, désactivés et non vérifiés |

Les 100 identités sont sélectionnées individuellement : Fatou Diallo, Aminata Traoré,
Moussa Diop, Chloé Bernard, Koffi Kouassi, etc. Les e-mails suivent le format
`prenom.nom@example.test`, sans accents. La liste complète, numérotée de 1 à 100,
figure dans `fixture_people` au début de `demo.sql`. Ces profils sont fictifs.

Les 100 comptes ont une connexion locale par mot de passe. Aucun faux compte Google
n'est lié. Ces identifiants publics sont destinés à une base de démonstration uniquement.

## Contenu

| Table | Nombre de lignes |
| --- | ---: |
| users | 100 |
| trips | 500 (100 terminés, 50 annulés, 350 actifs) |
| trip_bookings | 1 000, couvrant les six statuts |
| traveler_reviews | 150 (100 avis soumis et 50 invitations) |
| parcel_requests | 200 |
| conversations | 200 (100 liées à un trajet et 100 à une demande) |
| messages | 800, lus et non lus |
| trip_alerts | 100 |

Les colis couvrent 20 situations concrètes (manuels scolaires, dossier universitaire,
tissus de couture, vêtements, romans…) avec un poids et une description adaptés.
Les conversations emploient les prénoms des interlocuteurs, les parcours et le contenu
du colis concerné ; les commentaires d’avis sont cohérents avec leur note.
Les titres et messages affichés ne portent aucun préfixe technique « FIXTURE ».

Les parcours relient des villes européennes et africaines, avec des capacités,
prix et modes d'acceptation variés. Les réservations utilisent le mode commercial
`FREE` et un taux de frais nul. Les réservations acceptées sur des trajets actifs
disposent d'un code de validation de démonstration à six chiffres, consultable en
base ; aucun envoi réel n'est déclenché. Les invitations aux avis ont des empreintes
fictives, sans lien de soumission utilisable.

## Relances et isolation

Les identifiants `-910000001` à `-910001000` sont réservés, indépendamment dans
chaque table. Les trajets ont des références `FIXTURE-0001` à `FIXTURE-0500`.
Le script n'appelle aucune séquence : les créations normales gardent leurs IDs positifs.

Une nouvelle exécution conserve intégralement les lignes déjà présentes et ajoute
les lignes absentes. Les dates initiales ne sont pas rafraîchies : le jeu vieillit
naturellement. L'horloge initiale est reconstruite depuis les utilisateurs de la
fixture encore présents. Sans aucun de ces utilisateurs, un nouveau chargement
utilise la date courante.

L'appartenance à la fixture est reconnue par l'ID et des clés stables : e-mail pour
les comptes, référence et voyageur pour les trajets, relations et titre/contenu
pour les colis/messages, relations pour les conversations, empreinte pour les avis,
et utilisateur/parcours pour les alertes. Les changements de statut, mot de passe,
profil et dates sont conservés. Modifier une clé stable entraîne une collision à
la relance ; le script refuse alors le chargement au lieu d'écraser des données.

Les collisions d'ID et de clés uniques sont vérifiées avant insertion. Toutes les
insertions sont atomiques ; toute erreur annule le chargement. Les tables temporaires
sont supprimées au commit. Un verrou d'écriture sur les huit tables sérialise les
chargements ; l'exécuter pendant une période sans activité sur la base de démonstration.
Aucune donnée existante n'est supprimée et aucun reset automatique n'est fourni.

Si la première version a déjà été chargée, ses e-mails `fixture.userNNN@example.test`
et ses anciens titres/messages sont reconnus et conservés. Cette version améliore
les nouvelles insertions ; elle ne transforme pas les lignes déjà chargées. Pour
visualiser entièrement le nouveau jeu, utiliser une base de démonstration vierge
initialisée par le backend.

## Vérification

Depuis `back-office`, avec Java 21 ou compatible et Docker accessible :

```sh
./mvnw -B -Dtest=DemoFixtureIntegrationTest test
./mvnw -B verify
```

Les tests JUnit utilisent Testcontainers et PostgreSQL 16 éphémère, avec le schéma
créé par Hibernate et le véritable fichier SQL. Ils n'accèdent pas à la base locale.
