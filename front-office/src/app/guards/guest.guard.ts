import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard that only allows guests (unauthenticated users).
 * Authenticated users are redirected to the home page.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!(authService.isLoggedIn() && authService.getUser() !== null)) {
    return true;
  }

  return router.createUrlTree(['/']);
};
