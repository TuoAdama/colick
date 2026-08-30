import { HttpInterceptorFn } from '@angular/common/http';
import { inject, InjectionToken, PLATFORM_ID, REQUEST } from '@angular/core';
import { isPlatformServer } from '@angular/common';

export const SSR_API_BASE_URL = new InjectionToken<string>('SSR_API_BASE_URL', {
  providedIn: 'root',
  factory: () => '',
});

/** Resolves relative API calls inside Node and forwards only the auth cookie. */
export const serverApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isPlatformServer(inject(PLATFORM_ID)) || !req.url.startsWith('/api')) {
    return next(req);
  }

  const apiBaseUrl = inject(SSR_API_BASE_URL).replace(/\/$/, '');
  const serverUrl = apiBaseUrl.endsWith('/api')
    ? `${apiBaseUrl}${req.url.slice('/api'.length)}`
    : `${apiBaseUrl}${req.url}`;
  const incomingRequest = inject(REQUEST, { optional: true });
  const cookieHeader = incomingRequest?.headers.get('cookie');
  const authCookie = cookieHeader
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('COLICLIC_AUTH='));

  return next(req.clone({
    url: serverUrl,
    ...(authCookie ? { setHeaders: { Cookie: authCookie } } : {}),
  }));
};
