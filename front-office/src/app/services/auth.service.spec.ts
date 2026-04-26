import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
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

    const storedRaw = localStorage.getItem('colick_user');
    expect(storedRaw).not.toBeNull();
    const storedUser = JSON.parse(storedRaw!);
    expect(storedUser.photoUrl).toBe('/api/uploads/avatar.png');
    expect(service.getUser()?.photoUrl).toBe('/api/uploads/avatar.png');
  });

  it('normalizes relative profile photo URL after upload', () => {
    localStorage.setItem('colick_token', 'jwt-token');
    localStorage.setItem('colick_user', JSON.stringify({
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
});
