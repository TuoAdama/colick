import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { UserResponse } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';
import { SettingsPageComponent } from './settings-page.component';

describe('SettingsPageComponent', () => {
  let fixture: ComponentFixture<SettingsPageComponent>;
  let component: SettingsPageComponent;

  const currentUser$ = new BehaviorSubject<UserResponse>({
    id: 1,
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    role: 'USER',
    phone: '+33 6 00 00 00 00',
    identityDocument: 'AA123456',
    hasPassword: true,
  });

  const authServiceMock = {
    isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
    getUser: jasmine.createSpy('getUser').and.callFake(() => currentUser$.getValue()),
    currentUser$,
    uploadPhoto: jasmine.createSpy('uploadPhoto').and.returnValue(of(currentUser$.getValue())),
    updateProfile: jasmine.createSpy('updateProfile').and.returnValue(of(currentUser$.getValue())),
    requestEmailChange: jasmine.createSpy('requestEmailChange').and.returnValue(of(void 0)),
    changePassword: jasmine.createSpy('changePassword').and.returnValue(of(currentUser$.getValue())),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
