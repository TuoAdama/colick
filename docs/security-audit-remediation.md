# Correctifs de l’audit de sécurité du commit 01c8782

Les cinq constats de l’audit sont couverts par des correctifs et des tests JUnit.

| Constat | Comportement corrigé | Vérification |
| --- | --- | --- |
| Accès aux comptes d’autrui | Lecture du profil privé, modification du profil, photo, changement d’e-mail et changement de mot de passe exigent le propriétaire dans le service. Le DTO de profil ne contient plus de mot de passe. L’administration conserve ses routes de consultation dédiées. | Tests HTTP avec acteurs et cibles USER/ADMIN ; modification de son propre profil sans activation de la connexion locale. |
| Documents actifs dans les photos | Les trois endpoints photo appliquent la limite de 5 Mio et décodent JPEG, PNG ou WebP, avec une limite de 20 millions de pixels. Les images sont réencodées sans reprendre les métadonnées ni les données ajoutées au fichier ; WebP est stocké en PNG. Les ressources publiques refusent les extensions actives, y compris les anciens uploads, et ajoutent CSP sandbox et nosniff. | Tests HTTP sur les trois endpoints : HTML, SVG, faux JPEG/PNG/WebP, vraie image réencodée et servie ; tests unitaires avec un vrai WebP. |
| Sessions conservées | Chaque JWT contient l’identifiant du compte et sa version de session. Le filtre exige un compte activé, le même identifiant et la même version. Le remplacement du mot de passe, sa réinitialisation, la désactivation/réactivation et la confirmation d’un changement d’e-mail révoquent les anciennes sessions. | Ancien cookie refusé avec 401 après changement/reset/désactivation, nouveau cookie accepté, ancien JWT sans version refusé, réattribution d’e-mail refusée. |
| Codes de livraison illimités | Expiration sept jours après l’arrivée prévue ou l’émission, si elle est plus tardive. Cinq erreurs entraînent un blocage de quinze minutes, puis 429 avec Retry-After. Les erreurs sont persistées malgré la réponse 400. Les mutations d’un même trajet sont sérialisées par verrou pessimiste en base. | Tests avec transactions réelles : code expiré ou sans date, compteurs persistants via HTTP, dix essais concurrents limités à cinq, reprise après blocage. |
| Surcapacité | La capacité est recalculée à l’acceptation. Créations instantanées, acceptations, changements de statut et modifications de capacité partagent le verrou du trajet. La capacité ne peut pas être abaissée sous le poids déjà accepté. | Acceptations successives/concurrentes, réservations instantanées concurrentes et réduction de capacité refusée. |

Deux points complémentaires de l’audit sont également corrigés :

- `JWT_SECRET` est obligatoire ; la configuration ne possède plus de secret de secours. Une clé trop courte est refusée par JJWT. Fournir une valeur aléatoire propre à chaque environnement, par exemple issue de `openssl rand -base64 48`.
- Une erreur Redis ou une réponse absente du limiteur d’authentification refuse la connexion et la demande de réinitialisation avec 429 et `Retry-After: 60`. Une panne Redis rend donc temporairement ces opérations indisponibles ; superviser Redis et ces erreurs.

## Déploiement

La mise à jour de schéma Hibernate déjà configurée ajoute `users.session_version`,
`trip_bookings.validation_code_expires_at`, `validation_code_failed_attempts` et
`validation_code_blocked_until`. Les versions nulles des anciens comptes valent
zéro. Les anciens JWT sans version sont refusés : les utilisateurs doivent se
reconnecter après ce déploiement, ainsi qu’après un changement de mot de passe.
Les codes existants avec une date d’émission utilisent la même règle d’expiration ;
un code ancien sans date d’émission est refusé.


Le déploiement exige `JWT_SECRET` dans les variables d’environnement. Faire la
rotation de tout secret précédemment partagé ou utilisant l’ancienne valeur de
secours. Déployer toutes les instances API ensemble pour que toutes appliquent
la révocation et les verrous. Les tests de concurrence locaux utilisent H2 ; le
verrou de production est fourni par PostgreSQL.

Les fichiers HTML/SVG déjà stockés ne sont plus servis par l’API ; ils ne sont pas
supprimés du volume. Aucune configuration distante ni protection des branches
GitHub n’a été modifiée. L’isolation des médias sur une origine dédiée sans
cookies et la vérification des en-têtes Traefik restent des travaux
d’infrastructure distincts.

## Validation locale

- `cd back-office && ./mvnw -B verify` : 355 tests JUnit réussis et JAR généré.
- `cd front-office && npm test -- --watch=false --browsers=ChromeHeadless` : 706 tests Jasmine/Karma réussis.
- `cd front-office && npm run build` : build de production réussi ; avertissements de budgets CSS déjà présents dans les pages non modifiées.
- Les tests de capacité et de limitation des essais utilisent plusieurs transactions simultanées ; les tests de révocation passent par le filtre JWT et les endpoints HTTP réels.


## Références techniques

- [Spring Data JPA : verrouillage](https://docs.spring.io/spring-data/jpa/reference/jpa/locking.html)
- [OWASP : validation et stockage des fichiers](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [TwelveMonkeys : décodeur ImageIO WebP](https://github.com/haraldk/TwelveMonkeys)
