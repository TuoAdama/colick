import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import {
  SSR_API_BASE_URL,
  SSR_AUTH_COOKIE_NAME,
} from './interceptors/server-api.interceptor';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    {
      provide: SSR_API_BASE_URL,
      useFactory: () => process.env['SSR_API_BASE_URL'] ?? 'http://back-office:8080/api',
    },
    {
      provide: SSR_AUTH_COOKIE_NAME,
      useFactory: () => process.env['AUTH_COOKIE_NAME'] || 'COLICLIC_AUTH',
    },
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
