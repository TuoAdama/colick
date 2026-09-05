import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', [
      'isLoggedIn',
      'getUser',
    ]);

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }],
    });

    router = TestBed.inject(Router);
  });

  it('allows authenticated users to access protected routes', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    authServiceMock.getUser.and.returnValue({
      id: 1,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      role: 'USER',
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/messages?conversationId=100' } as never)
    );

    expect(result).toBeTrue();
  });

  it('preserves the protected URL when redirecting anonymous users to login', () => {
    authServiceMock.isLoggedIn.and.returnValue(false);
    authServiceMock.getUser.and.returnValue(null);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/messages?conversationId=100' } as never)
    );

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe(
      '/login?returnUrl=%2Fmessages%3FconversationId%3D100'
    );
  });
});
