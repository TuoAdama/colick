import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID, REQUEST } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  serverApiInterceptor,
  SSR_API_BASE_URL,
  SSR_AUTH_COOKIE_NAME,
} from './server-api.interceptor';

describe('serverApiInterceptor', () => {
  it('resolves API URLs and forwards only the auth cookie on the server', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([serverApiInterceptor])),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: SSR_API_BASE_URL, useValue: 'http://back-office:8080/api' },
        {
          provide: REQUEST,
          useValue: {
            headers: new Headers({ cookie: 'theme=dark; COLICLIC_AUTH=signed-jwt; analytics=1' }),
          } as Request,
        },
      ],
    });
    const http = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);

    http.get('/api/auth/session').subscribe();

    const request = httpMock.expectOne('http://back-office:8080/api/auth/session');
    expect(request.request.headers.get('Cookie')).toBe('COLICLIC_AUTH=signed-jwt');
    request.flush({});
    httpMock.verify();
  });

  it('forwards a configured non-default auth cookie', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([serverApiInterceptor])),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: SSR_API_BASE_URL, useValue: 'http://back-office:8080/api' },
        { provide: SSR_AUTH_COOKIE_NAME, useValue: 'CUSTOM_AUTH' },
        {
          provide: REQUEST,
          useValue: {
            headers: new Headers({ cookie: 'COLICLIC_AUTH=ignored; CUSTOM_AUTH=signed-jwt; theme=dark' }),
          } as Request,
        },
      ],
    });
    const http = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);

    http.get('/api/auth/session').subscribe();

    const request = httpMock.expectOne('http://back-office:8080/api/auth/session');
    expect(request.request.headers.get('Cookie')).toBe('CUSTOM_AUTH=signed-jwt');
    request.flush({});
    httpMock.verify();
  });
});
