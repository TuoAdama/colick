import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Also used as canActivateChild so navigating between admin pages rechecks the session. */
export const adminGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.initializeSession();
  const user = auth.getUser();
  if (user?.role === 'ADMIN') return true;
  if (user) return router.createUrlTree(['/dashboard']);
  if (auth.getSessionStatus() === 'unavailable') return false;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
