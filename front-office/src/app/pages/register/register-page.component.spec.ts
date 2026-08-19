import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { RegisterPageComponent } from './register-page.component';
import { AuthService } from '../../services/auth.service';
import { GoogleIdentityService } from '../../services/google-identity.service';

describe('RegisterPageComponent', () => {
  let fixture: ComponentFixture<RegisterPageComponent>;
  let component: RegisterPageComponent;
  let router: Router;
  let navigateSpy: jasmine.Spy;
  const authServiceMock = {
    register: jasmine.createSpy('register').and.returnValue(of({ id: 1 } as any)),
    googleLogin: jasmine.createSpy('googleLogin').and.returnValue(of({
      token: 'jwt-token',
      type: 'Bearer',
      user: {
        id: 2,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        role: 'USER',
        hasPassword: false,
      },
    })),
  };
  const googleIdentityServiceMock = {
    renderButton: jasmine.createSpy('renderButton').and.resolveTo(false),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: GoogleIdentityService, useValue: googleIdentityServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('shows activation message after successful register', fakeAsync(() => {
    component.registerForm.setValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '',
      password: 'password123',
      confirmPassword: 'password123',
    });

    component.onSubmit();

    expect(authServiceMock.register).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: undefined,
      password: 'password123',
    });
    expect(component.registerForm.contains('identityDocument')).toBeFalse();
    expect(fixture.nativeElement.querySelector('#identityDocument')).toBeNull();
    expect(component.successMessage).toContain("Vérifiez votre e-mail");
    tick(2500);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  }));

  it('redirects to search after Google signup when profile is already complete', () => {
    component.onGoogleCredential('google-id-token');

    expect(authServiceMock.googleLogin).toHaveBeenCalledWith('google-id-token');
    expect(navigateSpy).toHaveBeenCalledWith(['/search']);
  });
});
