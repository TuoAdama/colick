import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard that redirects unauthenticated users to the login page.
 * The SSR app initializer resolves the cookie-backed session before guards run.
 */
export const authGuard: CanActivateFn = (_route, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.initializeSession().then(() => {
    if (authService.isLoggedIn()) {
      return true;
    }

    // A temporary API failure must not turn an unknown session into a confirmed
    // logout. Cancel this navigation without changing the URL; the browser-side
    // initializer remains retryable on the next navigation.
    if (authService.getSessionStatus() === 'unavailable') {
      return false;
    }

    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  });
};
