import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <nav aria-label="Rubriques de l’administration" class="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 pt-4 sm:px-6 lg:px-8">
      <a routerLink="/admin/users" routerLinkActive="bg-primary/10 text-primary" [ariaCurrentWhenActive]="true"
         class="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/10">Utilisateurs</a>
      <a routerLink="/admin/trips" routerLinkActive="bg-primary/10 text-primary" [ariaCurrentWhenActive]="true"
         class="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/10">Trajets publiés</a>
    </nav>
    <router-outlet />
  `,
})
export class AdminLayoutComponent {}
