# Plan — ouvrir le modal de recherche depuis le crayon mobile

## Goal
Sur `/search?from=Nantes&to=Paris`, le clic sur le crayon de la recherche compacte mobile doit ouvrir le modal de recherche, et la fermeture du modal doit réafficher la recherche compacte qui l’a ouvert au lieu d’afficher le grand formulaire inline.

## Current context / assumptions

- Le dépôt est un monorepo Angular/Spring Boot ; la fonctionnalité concernée est exclusivement dans `front-office/`.
- Le front-office utilise Angular 19, des composants standalone, Jasmine/Karma via `npm test` — pas JUnit pour cette partie (`front-office/AGENTS.md`).
- La page concernée est `front-office/src/app/pages/search/search-page.component.ts` avec son template et ses tests.
- L’état actuel est :
  - `isMobileSearchEditing` masque/affiche le grand formulaire mobile ;
  - le résumé compact est rendu par `[data-testid="mobile-search-summary"]` ;
  - son clic fait seulement `isMobileSearchEditing = true` ;
  - le modal existe déjà sous `[data-testid="search-modal"]` ;
  - `closeSearchModal()` met uniquement `isSearchModalOpen` à `false`.
- Le crayon est le bouton résumé lui-même (`aria-label="Modifier la recherche"`), pas un bouton séparé. Le clic doit donc ouvrir directement le modal avec le focus sur le champ de départ.
- Le comportement desktop doit rester inchangé : le formulaire principal reste visible à partir de `md`.
- L’URL de reproduction mentionnée par la demande est `https://preprod.coliclic.com/search?from=Nantes&to=Paris`; les tests unitaires utiliseront des paramètres équivalents (`from=Nantes`, `to=Paris`) sans dépendre du réseau ni de l’environnement preprod.

## Architecture / proposed approach
Réutiliser le modal de recherche déjà présent plutôt que créer un second formulaire ou une nouvelle modalisation. Le résumé compact ouvrira `openSearchModal('departure')`, et `closeSearchModal()` réinitialisera explicitement l’état mobile d’édition afin que la condition du template rende à nouveau le résumé et garde le grand formulaire caché. Conserver `isMobileSearchEditing` uniquement si les tests et la structure actuelle le justifient ; ne pas introduire de nouvel état.

## Step-by-step tasks

### 1. Préparer la branche et confirmer la base de travail

- Lire les instructions déjà inspectées : `AGENTS.md`, `front-office/AGENTS.md`, `readme.md`.
- Depuis la racine du dépôt, synchroniser `preprod` puis créer une branche dédiée. À exécuter uniquement pendant l’implémentation, pas en mode plan :

```bash
git checkout preprod
git pull origin preprod
git checkout -b feat/<issue-id>-search-edit-modal
```

- Remplacer `<issue-id>` par l’identifiant réel fourni par le ticket. Si aucun identifiant n’existe, demander cet identifiant avant la création de branche plutôt que d’inventer une convention différente.
- Vérifier la base :

```bash
git status --short --branch
```

Résultat attendu : branche `feat/<issue-id>-search-edit-modal` basée sur `preprod`, sans modification de fichier.

### 2. Ajouter le test rouge pour le clic sur le crayon

Fichier : `front-office/src/app/pages/search/search-page.component.spec.ts`

Dans le test existant `shows a compact summary for a complete route and lets the user edit it`, remplacer le bloc de clic et d’assertions :

```typescript
summary.click();
fixture.detectChanges();
expect(component.isMobileSearchEditing).toBeTrue();
component.searchTrips();
expect(component.isMobileSearchEditing).toBeFalse();
```

par le scénario attendu :

```typescript
summary.click();
fixture.detectChanges();

expect(component.isSearchModalOpen).toBeTrue();
expect(component.isMobileSearchEditing).toBeFalse();
expect(fixture.nativeElement.querySelector('[data-testid="search-modal"]')).not.toBeNull();
expect(fixture.nativeElement.querySelector('[aria-label="Formulaire de recherche"]')?.classList.contains('hidden')).toBeTrue();
```

Ajouter immédiatement après un test séparé qui verrouille la fermeture et la réapparition du composant ouvreur :

```typescript
it('restores the compact search summary when the edit modal is closed', () => {
  setQueryParams({ from: 'Nantes', to: 'Paris' });
  fixture.detectChanges();

  const host = fixture.nativeElement as HTMLElement;
  const summary = host.querySelector<HTMLButtonElement>('[data-testid="mobile-search-summary"]');
  summary!.click();
  fixture.detectChanges();

  expect(host.querySelector('[data-testid="search-modal"]')).not.toBeNull();
  expect(host.querySelector('[data-testid="mobile-search-summary"]')).toBeNull();

  component.closeSearchModal();
  fixture.detectChanges();

  expect(host.querySelector('[data-testid="search-modal"]')).toBeNull();
  expect(host.querySelector('[data-testid="mobile-search-summary"]')).not.toBeNull();
  expect(host.querySelector('[aria-label="Formulaire de recherche"]')?.classList.contains('hidden')).toBeTrue();
});
```

Exécuter le test ciblé avant toute modification de production :

```bash
cd front-office
npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/search/search-page.component.spec.ts'
```

Résultat attendu à l’étape RED : échec du test car le clic actuel ne met pas `isSearchModalOpen` à `true` (le test doit échouer pour l’absence du comportement demandé, pas pour une erreur de compilation ou de sélecteur).

Commit fréquent après la rédaction du test :

```bash
git add front-office/src/app/pages/search/search-page.component.spec.ts
git commit -m "test: cover search edit modal flow"
```

### 3. Modifier le clic du résumé pour ouvrir le modal

Fichier : `front-office/src/app/pages/search/search-page.component.html`

Sur le bouton `[data-testid="mobile-search-summary"]`, remplacer exactement :

```html
(click)="isMobileSearchEditing = true"
```

par :

```html
(click)="openSearchModal('departure')"
```

Ne pas modifier la condition de rendu suivante :

```html
@if (isFormValid && hasSearched && !isMobileSearchEditing) {
```

Elle garantit que le résumé est le composant visible avant l’ouverture du modal et que le grand formulaire inline reste masqué après une recherche complète.

Relancer le test ciblé :

```bash
cd front-office
npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/search/search-page.component.spec.ts'
```

Résultat attendu : le test d’ouverture passe, mais le test de fermeture peut encore échouer si `closeSearchModal()` ne réinitialise pas `isMobileSearchEditing` dans le cas où une ancienne interaction l’aurait activé. Identifier l’échec exact avant l’étape suivante.

Commit :

```bash
git add front-office/src/app/pages/search/search-page.component.html
git commit -m "fix: open search edit modal from mobile summary"
```

### 4. Garantir la restauration du composant ouvreur à la fermeture

Fichier : `front-office/src/app/pages/search/search-page.component.ts`

Remplacer la méthode actuelle :

```typescript
closeSearchModal(): void {
  this.isSearchModalOpen = false;
}
```

par :

```typescript
closeSearchModal(): void {
  this.isSearchModalOpen = false;
  this.isMobileSearchEditing = false;
}
```

Cette implémentation est volontairement minimale : elle ferme le modal et remet l’état de présentation mobile dans l’état qui rend `[data-testid="mobile-search-summary"]`. Elle ne réinitialise pas les critères, l’historique, les résultats ou l’URL.

Relancer le scénario ciblé :

```bash
cd front-office
npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/search/search-page.component.spec.ts'
```

Résultat attendu : tous les tests de `SearchPageComponent` passent, notamment l’ouverture depuis le résumé et la réapparition du résumé après fermeture.

Commit :

```bash
git add front-office/src/app/pages/search/search-page.component.ts
git commit -m "fix: restore compact search trigger on modal close"
```

### 5. Vérifier les chemins de fermeture du modal

Fichier concerné : `front-office/src/app/pages/search/search-page.component.html`.

Vérifier que les trois chemins existants continuent d’appeler la même méthode :

```html
(click)="closeSearchModal()"
(keydown.escape)="closeSearchModal()"
```

et le bouton :

```html
(click)="closeSearchModal()"
```

Ajouter dans `search-page.component.spec.ts` un test d’accessibilité/comportement pour le bouton de fermeture :

```typescript
it('restores the compact summary when the modal close button is clicked', () => {
  setQueryParams({ from: 'Nantes', to: 'Paris' });
  fixture.detectChanges();

  const host = fixture.nativeElement as HTMLElement;
  host.querySelector<HTMLButtonElement>('[data-testid="mobile-search-summary"]')!.click();
  fixture.detectChanges();

  host.querySelector<HTMLButtonElement>('[aria-label="Fermer la recherche"]')!.click();
  fixture.detectChanges();

  expect(component.isSearchModalOpen).toBeFalse();
  expect(host.querySelector('[data-testid="mobile-search-summary"]')).not.toBeNull();
});
```

Exécuter uniquement ce test :

```bash
cd front-office
npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/search/search-page.component.spec.ts'
```

Résultat attendu : le test passe et confirme que le bouton visible de fermeture restaure le résumé.

Commit :

```bash
git add front-office/src/app/pages/search/search-page.component.spec.ts
 git commit -m "test: cover search modal close trigger restoration"
```

### 6. Refactor minimal après passage au vert

- Examiner les occurrences de `isMobileSearchEditing` :

```bash
rg -n "isMobileSearchEditing|mobile-search-summary|search-modal" front-office/src/app/pages/search
```

- Conserver `isMobileSearchEditing` si le code ou les tests existants en dépendent ; sinon, supprimer l’état et simplifier les deux conditions du template uniquement après avoir adapté les tests. Ne pas faire cette suppression dans la même étape que le correctif fonctionnel si elle n’est pas nécessaire.
- Vérifier que le modal continue de recevoir le focus de départ grâce à `searchModalInitialFocus` et que le clic du crayon ouvre le champ départ, comme le test existant `focuses the destination field...` et le test d’ouverture le garantissent.
- Exécuter le test ciblé après chaque éventuel nettoyage. Aucun nouveau comportement ne doit être introduit.

### 7. Validation complète et contrôle du diff

Depuis `front-office/` :

```bash
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
cd ..
git diff --check
```

Résultats attendus :

- `npm test ...` termine avec succès et aucun test en échec ;
- `npm run build` termine avec un code de sortie `0` ;
- `git diff --check` n’affiche aucune erreur d’espacement.

Vérifier le diff final :

```bash
git diff preprod...HEAD -- front-office/src/app/pages/search/search-page.component.ts front-office/src/app/pages/search/search-page.component.html front-office/src/app/pages/search/search-page.component.spec.ts
```

Le diff doit être limité au flux d’édition mobile et à ses tests ; aucune API, route, recherche, historique ou logique de réservation ne doit être modifiée.

### 8. Commit final et PR

Si les validations précédentes passent :

```bash
git status --short
git log --oneline --decorate -5
git push -u origin HEAD
gh pr create --base preprod --head "$(git branch --show-current)" \
  --title "fix: ouvrir l’édition de recherche dans un modal" \
  --body-file /tmp/search-edit-modal-pr.md
```

Avant la commande `gh pr create`, créer `/tmp/search-edit-modal-pr.md` avec une description indiquant :

- problème : le crayon affichait le grand formulaire inline ;
- correction : le crayon ouvre le modal existant et sa fermeture restaure le résumé compact ;
- tests : commande `npm test -- --watch=false --browsers=ChromeHeadless`, commande `npm run build`, `git diff --check`.

Le commit final doit utiliser un message conventionnel si un commit de regroupement est nécessaire :

```bash
git commit -m "fix: restore compact search trigger after modal close"
```

Après ouverture de la PR, vérifier l’état réel et les checks :

```bash
gh pr view --json number,state,baseRefName,headRefName,url
 gh pr checks
```

Ne pas déclarer la PR verte tant que `gh pr checks` n’a pas retourné les checks terminés avec succès.

## Tests / validation

Le cycle TDD est vertical et doit être suivi dans cet ordre :

1. Test rouge sur le clic du résumé/crayon : le modal doit s’ouvrir et le grand formulaire rester masqué.
2. Implémentation minimale du binding `(click)="openSearchModal('departure')"`.
3. Test rouge/vert sur `closeSearchModal()` : la fermeture doit rendre le résumé compact.
4. Implémentation minimale de `this.isMobileSearchEditing = false` dans `closeSearchModal()`.
5. Test du bouton de fermeture du modal, puis suite complète Angular.
6. Build Angular et `git diff --check`.
7. Vérification des checks de PR avec `gh pr checks`.

Les tests doivent vérifier le comportement utilisateur et les sélecteurs stables (`data-testid`, `aria-label`), pas la structure interne inutile du composant.

## Risks, tradeoffs, and open questions

- **Risque de régression de l’édition mobile :** le template possède déjà un état `isMobileSearchEditing`; le supprimer trop tôt pourrait réafficher le grand formulaire. Le plan privilégie donc le plus petit changement vérifiable.
- **Risque de confusion avec les filtres mobiles :** `closeMobileFilters()` est un flux distinct ; ne pas le modifier. La demande concerne uniquement `isSearchModalOpen` et le résumé de recherche.
- **Focus clavier :** l’ouverture depuis le crayon doit utiliser `openSearchModal('departure')`; ne pas appeler directement `isSearchModalOpen = true`, sinon le focus initial du modal peut être perdu.
- **Critères non sauvegardés :** fermer le modal doit seulement fermer l’interface et restaurer le résumé. Les valeurs déjà saisies dans le modal restent dans les propriétés du composant ; aucune annulation des critères n’est demandée.
- **Responsive :** le résumé compact est actuellement limité à `md:hidden`. Le comportement demandé s’applique donc au parcours mobile ; le formulaire desktop ne doit pas être converti en modal sans demande explicite.
- **Issue ID manquant :** le numéro de ticket n’est pas présent dans la demande. L’implémenteur doit le renseigner avant de créer la branche, conformément à `AGENTS.md`.
- **Preprod :** la PR vers `preprod` ne prouve pas à elle seule le déploiement sur `https://preprod.coliclic.com`; vérifier séparément le pipeline ou le déploiement avant d’annoncer que l’URL est corrigée.
