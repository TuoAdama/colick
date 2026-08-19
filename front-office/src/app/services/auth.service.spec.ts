import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('sends forgot password request with email', () => {
    service.forgotPassword('john@example.com').subscribe();

    const req = httpMock.expectOne('/api/auth/forgot-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'john@example.com' });
    req.flush(null);
  });

  it('sends reset password request with token and confirmation', () => {
    service.resetPassword('token123', 'password123', 'password123').subscribe();

    const req = httpMock.expectOne('/api/auth/reset-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      token: 'token123',
      newPassword: 'password123',
      confirmPassword: 'password123',
    });
    req.flush(null);
  });

  it('normalizes relative profile photo URL on login', () => {
    service.login('john@example.com', 'password123').subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({
      token: 'jwt-token',
      type: 'Bearer',
      user: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'USER',
        photoUrl: '/uploads/avatar.png',
      },
    });

    const storedRaw = localStorage.getItem('coliclic_user');
    expect(storedRaw).not.toBeNull();
    const storedUser = JSON.parse(storedRaw!);
    expect(storedUser.photoUrl).toBe('/api/uploads/avatar.png');
    expect(service.getUser()?.photoUrl).toBe('/api/uploads/avatar.png');
  });

  it('stores authenticated user after Google login', () => {
    service.googleLogin('google-id-token').subscribe();

    const req = httpMock.expectOne('/api/auth/google');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ idToken: 'google-id-token' });
    req.flush({
      token: 'jwt-token',
      type: 'Bearer',
      user: {
        id: 1,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        role: 'USER',
        hasPassword: false,
      },
    });

    expect(localStorage.getItem('coliclic_token')).toBe('jwt-token');
    expect(service.getUser()?.email).toBe('ada@example.com');
    expect(service.getUser()?.hasPassword).toBeFalse();
  });

  it('loads Google auth configuration', () => {
    service.getGoogleAuthConfig().subscribe((config) => {
      expect(config).toEqual({ enabled: true, clientId: 'google-client-id' });
    });

    const req = httpMock.expectOne('/api/auth/google/config');
    expect(req.request.method).toBe('GET');
    req.flush({ enabled: true, clientId: 'google-client-id' });
  });

  it('normalizes relative profile photo URL after upload', () => {
    localStorage.setItem('coliclic_token', 'jwt-token');
    localStorage.setItem('coliclic_user', JSON.stringify({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'USER',
    }));

    const file = new File(['image-bytes'], 'avatar.png', { type: 'image/png' });
    service.uploadPhoto(1, file).subscribe();

    const req = httpMock.expectOne('/api/users/1/photo');
    expect(req.request.method).toBe('POST');
    req.flush({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'USER',
      photoUrl: 'uploads/avatar.png',
    });

    expect(service.getUser()?.photoUrl).toBe('/api/uploads/avatar.png');
  });

  describe('logout()', () => {
    beforeEach(() => {
      // Seed storage and user state before each logout test
      localStorage.setItem('coliclic_token', 'jwt-token');
      localStorage.setItem('coliclic_user', JSON.stringify({
        id: 1, firstName: 'Ada', lastName: 'Lovelace',
        email: 'ada@example.com', role: 'USER',
      }));
    });

    it('removes token and user from localStorage', () => {
      service.logout();

      expect(localStorage.getItem('coliclic_token')).toBeNull();
      expect(localStorage.getItem('coliclic_user')).toBeNull();
    });

    it('sets currentUser to null', () => {
      let emittedUser: unknown = 'not-yet';
      service.currentUser$.subscribe((u) => (emittedUser = u));

      service.logout();

      expect(emittedUser).toBeNull();
    });

    it('navigates to /login after clearing state', () => {
      const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

      service.logout();

      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });

    it('isLoggedIn() returns false after logout', () => {
      service.logout();

      expect(service.isLoggedIn()).toBeFalse();
    });
  });
});
