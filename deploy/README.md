# Consulter les logs de préproduction

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
