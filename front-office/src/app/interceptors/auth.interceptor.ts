import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * URL prefixes that are public/unauthenticated and must never trigger
 * an automatic logout when they return 401 (e.g. wrong credentials on
 * the login endpoint, or public endpoints that happen to use 401).
 */
const SKIP_LOGOUT_PREFIXES = [
  '/api/auth/',   // login, google, forgot-password, reset-password …
];

/**
 * Functional HTTP interceptor that:
 * 1. Attaches the JWT Bearer token to every outgoing request when
 *    the user is authenticated.
 * 2. Intercepts HTTP 401 responses on protected endpoints and calls
 *    AuthService.logout() so the session is cleared and the user is
 *    redirected to /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Attach Authorization header when a token is available
  const cloned = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(cloned).pipe(
    catchError((error) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !SKIP_LOGOUT_PREFIXES.some((prefix) => req.url.startsWith(prefix))
      ) {
        // Token is expired or revoked — clear the session and redirect
        authService.logout();
      }
      return throwError(() => error);
    }),
  );
};
