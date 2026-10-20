import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { guestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';

describe('guestGuard', () => {
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

  it('returns true when the user is not logged in', () => {
    authServiceMock.isLoggedIn.and.returnValue(false);
    authServiceMock.getUser.and.returnValue(null);

    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));

    expect(result).toBeTrue();
  });

  it('returns UrlTree to "/" when the user is logged in', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    authServiceMock.getUser.and.returnValue({
      id: 1,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      role: 'USER',
    });

    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });
});
