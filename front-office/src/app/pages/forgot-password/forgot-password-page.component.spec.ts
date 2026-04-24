import { ComponentFixture, TestBed } from '@angular/core/testing';
import { throwError, of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { ForgotPasswordPageComponent } from './forgot-password-page.component';
import { AuthService } from '../../services/auth.service';

describe('ForgotPasswordPageComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordPageComponent>;
  let component: ForgotPasswordPageComponent;

  const authServiceMock = {
    forgotPassword: jasmine.createSpy('forgotPassword').and.returnValue(of(void 0)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordPageComponent);
    component = fixture.componentInstance;
    authServiceMock.forgotPassword.calls.reset();
    authServiceMock.forgotPassword.and.returnValue(of(void 0));
  });

  it('submits valid email and displays generic confirmation message', () => {
    component.forgotPasswordForm.setValue({ email: 'john@example.com' });

    component.onSubmit();

    expect(authServiceMock.forgotPassword).toHaveBeenCalledWith('john@example.com');
    expect(component.hasSubmitted).toBeTrue();
    expect(component.errorMessage).toBe('');
  });

  it('marks controls as touched and does not call service for invalid email', () => {
    component.forgotPasswordForm.setValue({ email: 'invalid-email' });

    component.onSubmit();

    expect(authServiceMock.forgotPassword).not.toHaveBeenCalled();
    expect(component.forgotPasswordForm.get('email')?.touched).toBeTrue();
  });

  it('keeps generic confirmation and shows technical error on request failure', () => {
    authServiceMock.forgotPassword.and.returnValue(throwError(() => ({ error: {} })));
    component.forgotPasswordForm.setValue({ email: 'john@example.com' });

    component.onSubmit();

    expect(component.hasSubmitted).toBeTrue();
    expect(component.errorMessage).toContain('erreur technique');
  });
});
