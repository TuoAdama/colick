---
name: coliclic-security-audit
description: Auditer la sécurité du projet Coliclic (Angular SSR, Spring Boot, autorisations métier et déploiement) et produire un rapport étayé sans modifier l’application. À utiliser pour un audit de sécurité ou une revue de sécurité de diff.
---

# Audit de sécurité Coliclic

Produire un rapport en français, exploitable par les développeurs, à partir de preuves dans la version examinée. Ce skill est une procédure d’audit pour Codex, pas un scanner autonome ni une garantie d’absence de vulnérabilités.

## Périmètre et prise de contexte

- Identifier la racine Git, le commit examiné et l’état du répertoire de travail. Lire `AGENTS.md`, les instructions applicables et `readme.md` à la racine avant l’analyse.
- Lire [la référence Coliclic](references/coliclic.md) pour les surfaces et invariants métier, puis vérifier les chemins, versions et configurations actuels. Le code et les manifests peuvent différer de la documentation.
- Auditer le dépôt entier par défaut : frontend, backend, dépendances, Docker et workflows. Pour une revue de diff, identifier la base et la cible demandées, examiner les changements et suivre leurs appels/configurations nécessaires ; ne rapporter comme régressions que les problèmes introduits ou aggravés par ces changements. Signaler séparément un problème préexistant pertinent. Si la base demandée est introuvable, demander laquelle utiliser, sans choisir silencieusement une autre branche.

## Limites d’action

- Auditer sans appliquer de correctif, ajouter de test au dépôt, modifier de dépendance ou de configuration, ni lancer de formatter, migration, déploiement ou commande de réparation automatique.
- Ne pas créer de branche, commit, PR ou rapport versionné de sa propre initiative pendant l’audit. Le périmètre explicitement demandé « audit seul, rapport dans le chat » exclut les étapes d’écriture du workflow de développement ; appliquer les autres instructions du dépôt. Le workflow de livraison du skill lui-même est distinct de son usage.
- Présenter le rapport dans le chat. Une demande de correction appelle une tâche distincte ; expliquer cette limite et fournir les recommandations sans les appliquer dans cet audit.
- Ne pas envoyer de messages, publier les résultats, transmettre le code à un service d’analyse externe ni effectuer de test contre un environnement distant. Un audit dynamique distant exige une autorisation distincte précisant la cible et les actions permises.
- Exécuter les tests existants seulement après avoir vérifié que leur configuration utilise des ressources locales de test et n’envoie pas d’e-mails/SMS réels. Ne pas lancer Docker Compose, les hooks de cycle de vie ou les tests d’intégration sans en vérifier les effets. Ne pas installer un scanner absent automatiquement.
- Réduire les lectures de secrets au nécessaire et filtrer les sorties avant de les afficher. Ne jamais reproduire de valeur sensible dans le chat, les commandes, les journaux ou un scénario. Rapporter uniquement le chemin, la ligne, le nom de variable et `[MASQUÉ]` ; ne pas tester la validité d’un identifiant découvert.

## Méthode d’analyse

1. Cartographier les points d’entrée, identités, rôles, ressources privées et frontières de confiance avec la référence Coliclic. Suivre les données du client jusqu’aux contrôles serveur et aux accès persistants.
2. Examiner chaque surface pertinente. Vérifier les protections déjà en place avant de signaler un défaut : une recherche textuelle, une route publique ou l’absence de guard Angular ne suffisent pas à prouver une faille.
3. Pour chaque piste, relier entrée contrôlable, protection manquante ou contournable et impact observable. Relever des lignes exactes de la version auditée. Contrôler les vérifications dans les services, les annotations de méthodes et les tests existants, pas seulement dans les contrôleurs.
4. Utiliser les outils déjà disponibles lorsque cela apporte une preuve. `npm audit --json` peut consulter le registre et transmettre les métadonnées de dépendances : vérifier que cette communication est permise avant exécution. Ne pas utiliser `npm audit fix`. Pour Maven, exploiter l’arbre de dépendances ou un scanner déjà configuré plutôt que d’ajouter un plugin au projet. Une commande échouée ou indisponible est un contrôle non réalisé, jamais un résultat rassurant.
5. Avant d’affirmer une CVE, vérifier l’avis officiel de l’éditeur ou l’enregistrement CVE officiel, sa date, les versions affectées et la version résolue dans le lockfile ou l’arbre Maven. Citer la source et distinguer dépendance affectée et exploitabilité dans cette application. Sans vérification possible, présenter une piste non confirmée, sans inventer d’identifiant ni de version corrective.
6. Si une vérification supplémentaire est utile, privilégier un test existant ou un cas synthétique dans un répertoire temporaire isolé, sans données réelles, accès distant ou modification du dépôt. Ne pas exécuter de charge destructive. Distinguer explicitement une démonstration statique d’une reproduction effectivement exécutée.

## Rapport attendu

Commencer par le périmètre, le commit, les éventuelles modifications locales incluses et une synthèse des risques. Puis présenter :

- **Vulnérabilités confirmées**, triées critique, élevée, moyenne, faible. La gravité dépend de l’impact, des prérequis et de l’exposition, sans score CVSS inventé.
- Pour chaque constat : titre, gravité justifiée, fichier et ligne, preuve minimale expurgée, scénario d’exploitation avec prérequis, impact métier, recommandation et test de non-régression proposé. Ne pas prétendre avoir exécuté le test proposé.
- **Points à vérifier** : hypothèses, preuves manquantes et vérifications nécessaires. Ne pas les compter comme des vulnérabilités confirmées.
- **Couverture et limites** : surfaces examinées, tests/commandes réellement exécutés et résultats, outils indisponibles, contrôles non réalisés et configuration distante inconnue.

Si aucune faille n’est confirmée, le dire dans les limites du périmètre et des contrôles effectués. Ne pas conclure que le projet est sécurisé sur la seule base de tests réussis ou de scanners sans alerte.
