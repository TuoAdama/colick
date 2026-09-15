import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ResetPasswordPageComponent } from './reset-password-page.component';
import { AuthService } from '../../services/auth.service';

describe('ResetPasswordPageComponent', () => {
  let fixture: ComponentFixture<ResetPasswordPageComponent>;
  let component: ResetPasswordPageComponent;

  const routeMock = {
    snapshot: {
      queryParamMap: convertToParamMap({ token: 'valid-token' }),
    },
  };

  const authServiceMock = {
    resetPassword: jasmine.createSpy('resetPassword').and.returnValue(of(void 0)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordPageComponent);
    component = fixture.componentInstance;
    authServiceMock.resetPassword.calls.reset();
    routeMock.snapshot.queryParamMap = convertToParamMap({ token: 'valid-token' });
    fixture.detectChanges();
  });

  it('shows error if token is missing from query params', () => {
    routeMock.snapshot.queryParamMap = convertToParamMap({});
    const noTokenFixture = TestBed.createComponent(ResetPasswordPageComponent);
    const noTokenComponent = noTokenFixture.componentInstance;

    noTokenFixture.detectChanges();

    expect(noTokenComponent.errorMessage).toContain('invalide');
  });

  it('blocks submission when passwords do not match', () => {
    component.resetPasswordForm.setValue({
      password: 'password123',
      confirmPassword: 'password456',
    });

    component.onSubmit();

    expect(authServiceMock.resetPassword).not.toHaveBeenCalled();
    expect(component.resetPasswordForm.hasError('passwordMismatch')).toBeTrue();
  });

  it('submits valid token and matching passwords', () => {
    component.resetPasswordForm.setValue({
      password: 'password123',
      confirmPassword: 'password123',
    });

    component.onSubmit();

    expect(authServiceMock.resetPassword).toHaveBeenCalledWith(
      'valid-token',
      'password123',
      'password123'
    );
    expect(component.isSuccess).toBeTrue();
    expect(component.errorMessage).toBe('');
  });
});
