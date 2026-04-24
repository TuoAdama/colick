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
});
