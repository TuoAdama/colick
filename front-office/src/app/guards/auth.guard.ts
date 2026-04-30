import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard that redirects unauthenticated users to the login page.
 * Checks both the stored token and the current user state so that
 * a post-logout navigation triggers correctly even before the token
 * is fully cleaned up.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Allow access only when a valid token exists AND user data is present
  if (authService.isLoggedIn() && authService.getUser() !== null) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
