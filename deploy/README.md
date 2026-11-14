# Consulter les logs de préproduction

## Vérifier l’indexabilité après déploiement

La préproduction reste accessible aux testeurs, mais ses réponses portent
`X-Robots-Tag: noindex`. `robots.txt` autorise l’exploration pour que les
moteurs puissent lire cette directive.

```bash
TRIP_REF=TRP-2026-000001
curl -sSI https://preprod.coliclic.com/ | grep -i '^x-robots-tag:'
curl -sSI 'https://preprod.coliclic.com/search?mode=all' | grep -i '^x-robots-tag:'
curl -sSI "https://preprod.coliclic.com/trips/ref/$TRIP_REF" | grep -i '^x-robots-tag:'
curl -sSI https://preprod.coliclic.com/robots.txt
curl -sS https://preprod.coliclic.com/robots.txt
curl -sSI https://coliclic.com/ | grep -i '^x-robots-tag:'
```

Les trois pages préprod doivent afficher `X-Robots-Tag: noindex`; `/robots.txt`
doit avoir le type `text/plain` et contenir `User-agent: *` puis `Allow: /`.
La dernière commande ne doit rien afficher : la règle ne s’applique pas au
domaine de production.

Si des URL préprod apparaissent déjà dans Google Search Console, inspecter
chaque URL après déploiement et lancer le test d’URL en direct. Vérifier que
Google peut explorer la page et détecte `noindex`, puis suivre la validation de
l’exclusion dans le rapport d’indexation. Ne supprimer aucun trajet de
production avant d’avoir identifié et signalé les éventuelles données de test.

Le script `logs.sh` est copié dans chaque release et doit être lancé depuis la release active :

```bash
ssh <user>@169.58.128.188
cd /opt/apps/colick/preprod/current
./logs.sh
```

Par défaut, la commande affiche les 200 dernières lignes du back-office. Les sorties console gardent un horodatage ISO 8601 avec fuseau horaire et ne contiennent pas les préfixes ajoutés par Docker Compose.

## Exemples

```bash
# Suivre le back-office en direct
./logs.sh --follow

# Afficher les erreurs de la dernière heure
./logs.sh --since 1h --level ERROR

# Afficher 500 lignes du front-office
./logs.sh front-office --lines 500

# Relire les fichiers persistants du back-office
./logs.sh back-office --archive --lines 1000
```

Les services acceptés sont `back-office`, `front-office`, `postgres` et `redis`. Les niveaux acceptés sont `TRACE`, `DEBUG`, `INFO`, `WARN` et `ERROR`. L'option `--archive` est réservée au back-office ; elle peut être combinée avec `--follow`, mais pas avec `--since`.

## Rétention et diagnostic

En préproduction, Logback écrit simultanément sur la console et dans le volume Docker `colick-preprod-back-office-logs`. Les fichiers sont stockés dans `/app/logs`, tournent quotidiennement ou à 20 Mo, sont conservés pendant 7 jours et ne peuvent pas dépasser 200 Mo au total.

Les paramètres `LOG_DIR`, `LOG_MAX_FILE_SIZE`, `LOG_MAX_HISTORY` et `LOG_TOTAL_SIZE_CAP` peuvent être remplacés dans `.release.env` avant l'exécution de Docker Compose. Ils ne sont pas activés en production par cette livraison.

En cas de problème :

1. vérifier l'état des services avec `docker compose -p colick-preprod --env-file .release.env -f compose.yml ps` ;
2. consulter le direct avec `./logs.sh --follow` ;
3. rechercher les erreurs avec `./logs.sh --level ERROR` ;
4. utiliser `./logs.sh --archive` si les anciennes lignes ne sont plus disponibles dans les logs Docker ;
5. lors d'un déploiement échoué, consulter également `deployment.log` dans le répertoire de la release concernée.

## Rétention des releases

Après chaque tentative de déploiement, le serveur conserve au maximum trois releases fonctionnelles par environnement. La release ciblée par le lien `current` est toujours protégée, puis les releases fonctionnelles les plus récentes complètent ce quota.

Une release activée avec succès contient le marqueur `.deployment-success`. Pour rester compatible avec les anciennes releases, un répertoire sans `deployment.log` est également considéré comme fonctionnel. Les tentatives échouées, identifiées par leur `deployment.log`, ne comptent pas dans le quota et sont conservées pour permettre le diagnostic.

La purge intervient uniquement après l'activation ou la fin du rollback. Une erreur de nettoyage est signalée dans les logs du déploiement sans remettre en cause l'état sain de l'application.

## Vérifier les protections HTTP en préproduction

Après déploiement, lancer `python3 deploy/check-preprod-http.py` depuis la racine du dépôt.
Le script vérifie la redirection permanente avec conservation de la requête, le HSTS
`max-age=86400`, la CSP en mode rapport sur les trois pages SSR et les en-têtes sur
l’API, `/health` et les vidéos. En local, fournir les correspondances `--connect-to`
vers le Traefik de test, `--insecure` pour son certificat autosigné et `--other-host`
pour vérifier qu’un nom extérieur à préprod échappe à la redirection.

Dans Chrome, ouvrir `/`, `/login` et `/search?mode=all` dans un profil sans extension.
Dans la console, relever la page, la directive, la ressource et l’action pour chaque
violation en mode rapport. La politique est fournie par `SSR_CSP_REPORT_ONLY` dans le
Compose de préprod et ses diagnostics sont consultés dans le navigateur.

| Pages | Directive observée en revue locale | Source |
| --- | --- | --- |
| Les trois pages | `script-src-elem` (`inline`) | Contrat Angular `ng-event-dispatch-contract` et appel inline `__jsaction_bootstrap` pour l’hydratation |
| Les trois pages | `script-src-attr` (`inline`) | Gestionnaires d’événements inline, dont `onload` sur la feuille de style Angular |

Le test local a confirmé le chargement des polices, la pagination du catalogue de
20 à 40 trajets et la lecture des deux vidéos. Un script inline de test a produit
un message dans la console et s’est exécuté. Le script Google s’est chargé, mais
l’iframe du bouton a répondu 403 dans le test Chrome local. Après déploiement,
confirmer l’entrypoint HTTP `web` sur le Traefik partagé et rejouer les contrôles
sur le domaine public, dont l’ouverture du sélecteur et l’ouverture de session
avec un compte Google de test. Relever les violations avant d’envisager une CSP
bloquante.
