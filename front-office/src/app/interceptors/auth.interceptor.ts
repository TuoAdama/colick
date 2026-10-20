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
    return new URL(url, 'http://localhost').pathname;
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
 * Clears the local user projection when the HTTP-only cookie is rejected by
 * a protected endpoint. The browser attaches same-origin cookies itself.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  return next(req).pipe(
    catchError((error) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isPublicEndpoint(req.url)
      ) {
        // Token is expired or revoked — clear the session and redirect
        authService.clearSessionAndRedirect();
      }
      return throwError(() => error);
    }),
  );
};
