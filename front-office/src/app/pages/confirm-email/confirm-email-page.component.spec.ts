import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ConfirmEmailPageComponent } from './confirm-email-page.component';

describe('ConfirmEmailPageComponent', () => {
  let fixture: ComponentFixture<ConfirmEmailPageComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['confirmEmail']);
    authService.confirmEmail.and.returnValue(of({
      id: 1,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      role: 'USER',
      hasPassword: true,
    }));

    TestBed.configureTestingModule({
      imports: [ConfirmEmailPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ token: 'signup-token' }) } } },
        { provide: AuthService, useValue: authService },
      ],
    });

    fixture = TestBed.createComponent(ConfirmEmailPageComponent);
    fixture.detectChanges();
  });

  it('does not consume the token until the user confirms', () => {
    expect(authService.confirmEmail).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Confirmer mon adresse e-mail');

    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    expect(authService.confirmEmail).toHaveBeenCalledOnceWith('signup-token');
    expect(fixture.nativeElement.textContent).toContain('Adresse e-mail confirmée');
  });
});
