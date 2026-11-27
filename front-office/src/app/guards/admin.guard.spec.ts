import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  let auth: jasmine.SpyObj<AuthService>;
  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['initializeSession', 'getUser', 'getSessionStatus']);
    auth.initializeSession.and.returnValue(Promise.resolve());
    auth.getSessionStatus.and.returnValue('anonymous');
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: auth }] });
  });
  const run = () => TestBed.runInInjectionContext(() => adminGuard({} as never, { url: '/admin/users/1/trips' } as never));

  it('allows admins after initializing the session', async () => {
    auth.getUser.and.returnValue({ id: 1, firstName: 'Ada', lastName: 'Admin', email: 'admin@test.com', role: 'ADMIN' });
    expect(await run()).toBeTrue();
    expect(auth.initializeSession).toHaveBeenCalled();
  });
  it('redirects ordinary users to their dashboard', async () => {
    auth.getUser.and.returnValue({ id: 1, firstName: 'Ada', lastName: 'User', email: 'user@test.com', role: 'USER' });
    expect(TestBed.inject(Router).serializeUrl(await run() as UrlTree)).toBe('/dashboard');
  });
  it('preserves the destination for anonymous visitors', async () => {
    auth.getUser.and.returnValue(null);
    expect(TestBed.inject(Router).serializeUrl(await run() as UrlTree)).toBe('/login?returnUrl=%2Fadmin%2Fusers%2F1%2Ftrips');
  });
  it('cancels navigation when the session is unavailable', async () => {
    auth.getUser.and.returnValue(null);
    auth.getSessionStatus.and.returnValue('unavailable');
    expect(await run()).toBeFalse();
  });
});
