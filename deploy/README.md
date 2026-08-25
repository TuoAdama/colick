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

Les services acceptés sont `back-office`, `front-office` et `postgres`. Les niveaux acceptés sont `TRACE`, `DEBUG`, `INFO`, `WARN` et `ERROR`. L'option `--archive` est réservée au back-office ; elle peut être combinée avec `--follow`, mais pas avec `--since`.

## Rétention et diagnostic

En préproduction, Logback écrit simultanément sur la console et dans le volume Docker `colick-preprod-back-office-logs`. Les fichiers sont stockés dans `/app/logs`, tournent quotidiennement ou à 20 Mo, sont conservés pendant 7 jours et ne peuvent pas dépasser 200 Mo au total.

Les paramètres `LOG_DIR`, `LOG_MAX_FILE_SIZE`, `LOG_MAX_HISTORY` et `LOG_TOTAL_SIZE_CAP` peuvent être remplacés dans `.release.env` avant l'exécution de Docker Compose. Ils ne sont pas activés en production par cette livraison.

En cas de problème :

1. vérifier l'état des services avec `docker compose -p colick-preprod --env-file .release.env -f compose.yml ps` ;
2. consulter le direct avec `./logs.sh --follow` ;
3. rechercher les erreurs avec `./logs.sh --level ERROR` ;
4. utiliser `./logs.sh --archive` si les anciennes lignes ne sont plus disponibles dans les logs Docker ;
5. lors d'un déploiement échoué, consulter également `deployment.log` dans le répertoire de la release concernée.
