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
  {
    path: 'propose',
    loadComponent: () =>
      import('./pages/propose-trip/propose-trip-page.component').then(
        (m) => m.ProposeTripPageComponent
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login-page.component').then(
        (m) => m.LoginPageComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register-page.component').then(
        (m) => m.RegisterPageComponent
      ),
  },
];
