import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const PUBLIC_ENDPOINT_PREFIXES = [
  '/api/auth/',
  '/api/locations/',
  '/api/trips/reference/',
];

const PUBLIC_ENDPOINT_PATHS = new Set([
  '/api/trips/search',
  '/api/trips/landing-feed',
]);

function getRequestPath(url: string): string {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url;
  }
}

function isPublicEndpoint(url: string): boolean {
  const path = getRequestPath(url);
  return (
    PUBLIC_ENDPOINT_PREFIXES.some((prefix) => path.startsWith(prefix)) ||
    PUBLIC_ENDPOINT_PATHS.has(path)
  );
}

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
        !isPublicEndpoint(req.url)
      ) {
        // Token is expired or revoked — clear the session and redirect
        authService.logout();
      }
      return throwError(() => error);
    }),
  );
};
