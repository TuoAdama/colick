# Surfaces de sécurité Coliclic

Les chemins ci-dessous sont relatifs à la racine du dépôt. Ils servent de points d’entrée, pas de constats de vulnérabilité. Vérifier leur présence et suivre les implémentations actuelles.

## Contexte réel et frontières

Coliclic met en relation voyageurs et expéditeurs de colis. Examiner l’isolation entre utilisateurs et les transitions de réservation/livraison avant les seuls contrôles de forme.

Le dépôt observé utilise Angular 19 avec rendu SSR Node/Express, Spring Boot 3 avec Java 21, PostgreSQL et Redis. Le README historique mentionne MySQL : vérifier `back-office/pom.xml`, `application.yml` et les fichiers Compose pour établir la configuration réelle. Ne pas figer les versions dans les conclusions.

Le backend a un contexte HTTP `/api` ; les matchers de Spring Security sont relatifs à ce contexte. Tenir compte du routage Traefik avant de comparer URL publiques et règles serveur.

## Angular, navigateur et SSR

Points d’entrée : `front-office/src/server.ts`, `src/app/app.config.server.ts`, `src/app/interceptors/`, `src/app/services/auth.service.ts`, `src/app/guards/` et les templates/composants consommateurs.

- Suivre les contenus utilisateur jusqu’aux sinks HTML, URL et DOM. Vérifier le contexte de sanitisation, les contournements `bypassSecurityTrust*`, redirections et scripts externes ; un binding Angular n’est pas automatiquement une XSS.
- Vérifier cookies et en-têtes d’authentification/CSRF dans les interceptors navigateur, leurs destinations et le comportement en cas de session expirée. Les guards facilitent la navigation ; les permissions doivent être imposées par le serveur.
- Vérifier que le SSR ne transmet le cookie d’authentification qu’à l’API attendue. Examiner la construction des URL, le préfixe `/api`, les hôtes, les en-têtes transférés et les risques de SSRF ou de fuite vers une origine tierce.
- Examiner `trust proxy`, `Host` et `X-Forwarded-*` en tenant compte du proxy réel. Contrôler l’absence d’état utilisateur partagé entre requêtes et de données privées réutilisées via cache HTML, transfert HTTP ou hydratation.
- Distinguer configuration publique et secret ; vérifier bundles, source maps et données sérialisées. Examiner aussi CSP/en-têtes au niveau de leur composant responsable (Express ou Traefik).

## Spring Boot et identité

Points d’entrée sous `back-office/src/main/java/com/coliclic/backoffice/` : `config/SecurityConfig.java`, `auth/`, `user/`, `admin/` et `exception/`. Comparer avec `src/main/resources/application.yml`, les configurations de déploiement et `src/test/`.

- JWT : source et robustesse du secret, signature, algorithme accepté, expiration, identité extraite et prise en compte des changements de compte/rôle ou de mot de passe. Ne pas supposer qu’un logout invalide tous les JWT.
- Cookies : `HttpOnly`, `Secure`, `SameSite`, portée, durée, suppression et cohérence avec HTTPS. Vérifier CSRF y compris login/logout, et CORS avec credentials, sans confondre CORS et contrôle d’accès.
- Google : signature, audience, émetteur, expiration, vérification de l’e-mail et association de comptes existants.
- Inscription, confirmation d’e-mail et reset : caractère imprévisible, expiration, usage unique, stockage des jetons, anti-énumération, validation des URL de retour et limitation des tentatives. Vérifier les appels Redis, les indisponibilités et la confiance accordée aux adresses IP transmises par proxy.
- Autorisations : annotations de méthodes, contrôle de propriété dans les services/repositories, champs modifiables et rôle `ADMIN`. Tester conceptuellement accès anonyme, propriétaire, autre utilisateur et administrateur.
- Examiner validation des DTO, limites de pagination/requêtes, requêtes SQL/JPA, erreurs et logs. Vérifier exposition de Swagger, Actuator et uploads selon l’environnement réel, pas seulement leurs valeurs locales par défaut.

## Invariants métier et données

- `trip/`, `parcelrequest/` : un utilisateur ne doit pas consulter ou modifier les ressources privées d’un autre par simple changement d’identifiant. Distinguer catalogue/profil publics et détails privés.
- Réservations : vérifier identité de l’expéditeur/voyageur, transitions autorisées, poids disponible, concurrence et transactions. Examiner la confirmation de livraison et la résistance aux répétitions et aux codes devinables.
- `messaging/` : vérifier la participation à une conversation pour lecture et écriture, les destinataires et les données diffusées par notification.
- `admin/`, `traveler/`, `user/` : vérifier rôle administratif, champs exposés dans les profils publics et absence de jetons ou données personnelles inutiles dans les réponses.
- Avis : vérifier que l’auteur est autorisé par une réservation et son état, la cible et l’unicité prévues par les règles métier actuelles.
- Uploads : rechercher les implémentations réelles ; vérifier taille, type détecté, nom/chemin, traversée de répertoires, contenu actif et permissions de lecture. Ne pas inventer un endpoint absent.
- `commercial/` et `docs/commercial-modes.md` : le mode `FREE` ne gère pas le paiement ; `COMMISSION` décrit une commission de 7 %. Vérifier calculs serveur, montants et transitions effectivement implémentés ; ne pas présumer l’existence d’un prestataire de paiement ni d’un encaissement réel.

## Infrastructure et chaîne de livraison

Examiner `front-office/package.json` et `package-lock.json`, `back-office/pom.xml`, Dockerfiles, `docker-compose.yml`, `deploy/` et `.github/workflows/`.

- Comparer les dépendances déclarées aux versions réellement résolues. Vérifier portée production/développement et chemin d’exploitation avant de classer une alerte.
- Chercher les secrets avec sorties expurgées, sans afficher les fichiers `.env` en entier. Un exemple local n’établit pas à lui seul la valeur effective en production ; une valeur sensible suivie par Git reste un sujet distinct.
- Distinguer les ports et mots de passe du développement des déploiements préprod/prod. Vérifier utilisateur des conteneurs, volumes, exposition PostgreSQL/Redis, TLS et en-têtes Traefik sans lancer de service ni accéder au serveur distant.
- Examiner permissions GitHub Actions, code non fiable des PR, interpolation de données dans le shell, accès aux secrets, références d’actions/images, construction et promotion des images. Ne pas modifier les workflows pendant l’audit.

## Vérifications locales disponibles

Avant exécution, inspecter les configs et outils installés. Depuis les répertoires concernés :

- Backend : `./mvnw -B verify` (JUnit/Spring Security Test ; vérifier le profil et les dépendances externes).
- Frontend : `npm test -- --watch=false --browsers=ChromeHeadless` (Jasmine/Karma ; Chrome et dépendances requis).
- Build frontend : `npm run build`.

Les tests réussis attestent des scénarios couverts, pas de l’absence de faille. Dans une revue ciblée, privilégier les tests pertinents déjà présents ; consigner précisément les échecs d’environnement et les contrôles omis.
