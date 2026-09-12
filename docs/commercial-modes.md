# Modes commerciaux Coliclic

Le modèle économique actif est sélectionné avec une seule variable d'environnement :

```dotenv
APP_COMMERCIAL_MODE=FREE
```

La valeur par défaut est `FREE`. Une modification prend effet au redémarrage du back-office ; le front-office récupère ensuite le profil public au démarrage via `GET /api/public/app-config`.

| Mode | Frais Coliclic | Paiement géré par Coliclic | Règlement |
| --- | ---: | --- | --- |
| `FREE` | 0 % | Non | Organisé directement entre les utilisateurs |
| `COMMISSION` | 7 % | Oui | Présenté comme sécurisé par la plateforme |

Dans les deux modes, le prix au kilo reste défini par le voyageur. Il correspond à sa rémunération et non aux frais de la plateforme.

## Configuration par environnement

Définir `APP_COMMERCIAL_MODE` dans le fichier d'environnement transmis à Docker Compose. Les fichiers Compose utilisent `FREE` lorsque la variable est absente. Le mode est exposé sans donnée sensible par l'API publique et apparaît dans la description OpenAPI.

Pour basculer vers le mode avec commission :

1. définir `APP_COMMERCIAL_MODE=COMMISSION` dans l'environnement ciblé ;
2. redéployer ou redémarrer le back-office ;
3. vérifier `/api/public/app-config` et `/api/swagger-ui.html` ;
4. ouvrir une page publique et une réservation pour contrôler les textes et les montants.

Le retour au mode gratuit suit la même procédure avec `APP_COMMERCIAL_MODE=FREE`. Aucune migration de base de données n'est nécessaire.

## Comportement en cas d'erreur

Le backend démarre en `FREE` si la variable est absente et refuse une valeur inconnue. Si le front-office ne peut pas charger la configuration publique, il adopte localement le profil `FREE` afin de ne jamais afficher par erreur une commission ou une promesse de paiement.

Les textes dépendant du modèle économique sont regroupés dans le catalogue commercial Angular. Les constantes `7 %` et `0.07` ne doivent pas être ajoutées ailleurs dans le code de production ; la CI contrôle cette règle.
