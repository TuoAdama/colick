---
description: Base workflow and conventions for all development tasks in the project, including branching, testing, and PR creation.
applyTo: '**/*' # applies to all files in the repo, ensuring these instructions are always available to the agent regardless of the file context
---

## Workflow obligatoire pour toute tâche
1. Crée une branche git avec le format : feat/<issue-id>-<short-description>
2. Lis et comprends le codebase avant d'écrire la moindre ligne
3. Implémente la fonctionnalité en respectant les conventions du projet
4. Écris des tests unitaires et fonctionnels pour ta fonctionnalité
5. Assure-toi que tous les tests passent localement
6. Commit avec un message conventionnel (feat:, fix:, etc.)
7. Ouvre une PR avec une description claire

## Conventions
- Tests : Junit
- Branches : feat/<issue-id>-<short-description>, fix/<issue-id>-<short-description>
- Ne touche jamais directement à `main` ou `preprod`
- Tu dois toujours faire un pull de `preprod` avant de créer ta branche pour t'assurer que tu travailles sur la base la plus récente.
- Tes branches doivent être créées à partir de `preprod` et non `main`.