import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserResponse } from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;
  const user: UserResponse = {
    id: 1, firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', role: 'USER', hasPassword: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpMock.verify());

  it('hydrates the cookie-backed session and initializes CSRF', async () => {
    const initialization = service.initializeSession();
    httpMock.expectOne('/api/auth/session').flush(user);
    await Promise.resolve();
    httpMock.expectOne('/api/auth/csrf').flush({ token: 'csrf-token' });
    await initialization;
    expect(service.isLoggedIn()).toBeTrue();
    expect(service.getUser()?.email).toBe('ada@example.com');
  });

  it('continues as a guest when no session cookie is valid', async () => {
    const initialization = service.initializeSession();
    httpMock.expectOne('/api/auth/session').flush({}, { status: 401, statusText: 'Unauthorized' });
    await Promise.resolve();
    httpMock.expectOne('/api/auth/csrf').flush({ token: 'csrf-token' });
    await initialization;
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('stores only the user returned by login', () => {
    service.login('ada@example.com', 'password123').subscribe();
    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.body).toEqual({ email: 'ada@example.com', password: 'password123' });
    req.flush({ user: { ...user, photoUrl: '/uploads/avatar.png' } });
    expect(service.getUser()?.photoUrl).toBe('/api/uploads/avatar.png');
    expect(localStorage.getItem('coliclic_token')).toBeNull();
    expect(localStorage.getItem('coliclic_user')).toBeNull();
  });

  it('stores the user after Google login', () => {
    service.googleLogin('google-id-token').subscribe();
    const req = httpMock.expectOne('/api/auth/google');
    expect(req.request.body).toEqual({ idToken: 'google-id-token' });
    req.flush({ user: { ...user, hasPassword: false } });
    expect(service.getUser()?.hasPassword).toBeFalse();
  });

  it('loads Google auth configuration', () => {
    service.getGoogleAuthConfig().subscribe((config) => {
      expect(config).toEqual({ enabled: true, clientId: 'google-client-id' });
    });
    httpMock.expectOne('/api/auth/google/config').flush({ enabled: true, clientId: 'google-client-id' });
  });

  it('normalizes the user after profile upload', () => {
    service.login('ada@example.com', 'password123').subscribe();
    httpMock.expectOne('/api/auth/login').flush({ user });
    service.uploadPhoto(1, new File(['image'], 'avatar.png', { type: 'image/png' })).subscribe();
    httpMock.expectOne('/api/users/1/photo').flush({ ...user, photoUrl: 'uploads/avatar.png' });
    expect(service.getUser()?.photoUrl).toBe('/api/uploads/avatar.png');
  });

  it('logs out, clears user state and navigates to login', () => {
    service.login('ada@example.com', 'password123').subscribe();
    httpMock.expectOne('/api/auth/login').flush({ user });
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    service.logout();
    httpMock.expectOne('/api/auth/logout').flush(null);
    expect(service.getUser()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('clears local state even when logout fails', () => {
    service.login('ada@example.com', 'password123').subscribe();
    httpMock.expectOne('/api/auth/login').flush({ user });
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    service.logout();
    httpMock.expectOne('/api/auth/logout').flush({}, { status: 500, statusText: 'Error' });
    expect(service.isLoggedIn()).toBeFalse();
  });
});
