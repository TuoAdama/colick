import { Routes } from '@angular/router';

/**
 * Application route definitions.
 * Landing page loads eagerly; feature pages are lazy-loaded.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing-page.component').then(
        (m) => m.LandingPageComponent
      ),
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./pages/search/search-page.component').then(
        (m) => m.SearchPageComponent
      ),
  },
];
