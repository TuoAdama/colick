import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { serverApiInterceptor } from './interceptors/server-api.interceptor';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { AuthService } from './services/auth.service';

export const appRouterScrolling = withInMemoryScrolling({
  scrollPositionRestoration: 'enabled',
});

/**
 * Application configuration with routing, HTTP client (with auth interceptor),
 * and zone change detection.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, appRouterScrolling),
    provideHttpClient(withInterceptors([serverApiInterceptor, authInterceptor])),
    provideClientHydration(withEventReplay()),
    provideAppInitializer(() => inject(AuthService).initializeSession()),
  ],
};
