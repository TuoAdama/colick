import { ComponentFixture, TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { LoginPageComponent } from './login-page.component';
import { AuthService } from '../../services/auth.service';

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let component: LoginPageComponent;
  let router: Router;
  const authServiceMock = {
    login: jasmine.createSpy('login').and.returnValue(
      throwError(() => ({
        error: { message: 'Votre compte n\'est pas encore activé.' },
      }))
    ),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('shows backend activation error message', () => {
    component.loginForm.setValue({
      email: 'john@example.com',
      password: 'password123',
    });

    component.onSubmit();

    expect(component.errorMessage).toContain('pas encore activé');
  });
});
