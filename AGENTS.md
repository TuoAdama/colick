# AGENT.md

## Workflow obligatoire pour toute tâche
1. Crée une branche git avec le format : feat/<issue-id>-<short-description>
2. Lis et comprends la logique métier située dans README.md à la racine du projet avant de commencer à coder
3. Lis et comprends le codebase avant d'écrire la moindre ligne
4. Implémente la fonctionnalité en respectant les conventions du projet
5. Écris des tests unitaires et fonctionnels pour ta fonctionnalité
6. Assure-toi que tous les tests passent localement
7. Commit avec un message conventionnel (feat:, fix:, etc.)
8. Ouvre une PR avec une description claire

## Conventions
- Tests : Junit
- Branches : feat/<issue-id>-<short-description>, fix/<issue-id>-<short-description>
- Ne touche jamais directement à `main` ou `preprod`
- Tu dois toujours faire un pull de `preprod` avant de créer ta branche pour t'assurer que tu travailles sur la base la plus récente.
- Tes branches doivent être créées à partir de `preprod` et non `main`.