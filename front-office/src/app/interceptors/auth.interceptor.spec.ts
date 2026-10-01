import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', [
      'clearSessionAndRedirect',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('does not attach an Authorization header', () => {
    http.get('/api/trips').subscribe();

    const req = httpMock.expectOne('/api/trips');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  // ── 401 handling on protected endpoints ────────────────────────────────

  it('clears the session when a protected endpoint returns 401', () => {
    http.get('/api/trips').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/trips');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.clearSessionAndRedirect).toHaveBeenCalled();
  });

  it('propagates the 401 error after calling logout', (done) => {
    http.get('/api/trips').subscribe({
      error: (err) => {
        expect(err.status).toBe(401);
        done();
      },
    });

    const req = httpMock.expectOne('/api/trips');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });

  // ── 401 handling on auth endpoints (must NOT trigger logout) ───────────

  it('does NOT call logout when /api/auth/ endpoint returns 401', () => {
    http.post('/api/auth/login', {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/auth/login');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.clearSessionAndRedirect).not.toHaveBeenCalled();
  });

  it('does NOT call logout when /api/auth/google returns 401', () => {
    http.post('/api/auth/google', {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/auth/google');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.clearSessionAndRedirect).not.toHaveBeenCalled();
  });

  it('does NOT call logout when /api/trips/landing-feed returns 401', () => {
    http.get('/api/trips/landing-feed?limit=3').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/trips/landing-feed?limit=3');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.clearSessionAndRedirect).not.toHaveBeenCalled();
  });

  it('does NOT call logout when /api/trips/reference returns 401', () => {
    http.get('/api/trips/reference/TRP-2026-000013').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/trips/reference/TRP-2026-000013');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.clearSessionAndRedirect).not.toHaveBeenCalled();
  });

  it('does NOT call logout when /api/locations/search returns 401', () => {
    http.get('/api/locations/search?q=Pa').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/locations/search?q=Pa');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.clearSessionAndRedirect).not.toHaveBeenCalled();
  });

  // ── Non-401 errors must not trigger logout ──────────────────────────────

  it('does NOT call logout for a 403 error on a protected endpoint', () => {
    http.get('/api/trips').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/trips');
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(authServiceMock.clearSessionAndRedirect).not.toHaveBeenCalled();
  });

  it('does NOT call logout for a 500 error on a protected endpoint', () => {
    http.get('/api/trips').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/trips');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(authServiceMock.clearSessionAndRedirect).not.toHaveBeenCalled();
  });
});
