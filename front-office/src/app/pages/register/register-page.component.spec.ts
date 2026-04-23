import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { RegisterPageComponent } from './register-page.component';
import { AuthService } from '../../services/auth.service';

describe('RegisterPageComponent', () => {
  let fixture: ComponentFixture<RegisterPageComponent>;
  let component: RegisterPageComponent;
  let router: Router;
  let navigateSpy: jasmine.Spy;
  const authServiceMock = {
    register: jasmine.createSpy('register').and.returnValue(of({ id: 1 } as any)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
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
      identityDocument: 'ID123',
      password: 'password123',
      confirmPassword: 'password123',
    });

    component.onSubmit();

    expect(component.successMessage).toContain("Vérifiez votre e-mail");
    tick(2500);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  }));
});
