import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { LoginPageComponent } from './login-page.component';
import { AuthService } from '../../services/auth.service';
import { GoogleIdentityService } from '../../services/google-identity.service';

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let component: LoginPageComponent;
  let router: Router;
  let routeMock: { snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> } };
  const authServiceMock = {
    login: jasmine.createSpy('login'),
    googleLogin: jasmine.createSpy('googleLogin'),
  };
  const googleIdentityServiceMock = {
    renderButton: jasmine.createSpy('renderButton').and.resolveTo(false),
  };

  beforeEach(async () => {
    routeMock = {
      snapshot: {
        queryParamMap: convertToParamMap({}),
      },
    };

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: GoogleIdentityService, useValue: googleIdentityServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
  });

  it('shows backend activation error message', () => {
    authServiceMock.login.and.returnValue(
      throwError(() => ({
        error: { message: 'Votre compte n\'est pas encore activé.' },
      }))
    );

    component.loginForm.setValue({
      email: 'john@example.com',
      password: 'password123',
    });

    component.onSubmit();

    expect(component.loginForm.get('password')?.value).toBe('');
    expect(component.loginForm.get('email')?.value).toBe('john@example.com');
    expect(component.errorMessage).toContain('pas encore activé');
  });

  it('clears password and uses fallback message when backend message is missing', () => {
    authServiceMock.login.and.returnValue(throwError(() => ({ error: {} })));

    component.loginForm.setValue({
      email: 'john@example.com',
      password: 'password123',
    });

    component.onSubmit();

    expect(component.loginForm.get('password')?.value).toBe('');
    expect(component.loginForm.get('email')?.value).toBe('john@example.com');
    expect(component.errorMessage).toBe('Email ou mot de passe incorrect.');
  });

  it('redirects to dashboard profile after Google login when identity document is missing', () => {
    authServiceMock.googleLogin.and.returnValue(of({
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
    }));

    component.onGoogleCredential('google-id-token');

    expect(authServiceMock.googleLogin).toHaveBeenCalledWith('google-id-token');
    expect(router.navigate).toHaveBeenCalledWith(
      ['/dashboard'],
      { queryParams: { tab: 'profile', completeProfile: 'identity' } }
    );
  });

  it('redirects to returnUrl after login when profile is complete', () => {
    routeMock.snapshot.queryParamMap = convertToParamMap({ returnUrl: '/trips/ref/TRP-2026-000013' });
    authServiceMock.login.and.returnValue(of({
      token: 'jwt-token',
      type: 'Bearer',
      user: {
        id: 1,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        role: 'USER',
        hasPassword: true,
        identityDocument: '/uploads/id.pdf',
      },
    }));

    component.loginForm.setValue({
      email: 'ada@example.com',
      password: 'password123',
    });
    component.onSubmit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/trips/ref/TRP-2026-000013');
    expect(router.navigate).not.toHaveBeenCalledWith(['/search']);
  });

  it('ignores ambiguous returnUrl after login', () => {
    routeMock.snapshot.queryParamMap = convertToParamMap({ returnUrl: '//example.com' });
    authServiceMock.login.and.returnValue(of({
      token: 'jwt-token',
      type: 'Bearer',
      user: {
        id: 1,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        role: 'USER',
        hasPassword: true,
        identityDocument: '/uploads/id.pdf',
      },
    }));

    component.loginForm.setValue({
      email: 'ada@example.com',
      password: 'password123',
    });
    component.onSubmit();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/search']);
  });
});
