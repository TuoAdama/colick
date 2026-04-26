import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { UserResponse } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';
import { MessagingService } from '../../services/messaging.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;

  let loggedIn = false;
  const currentUser$ = new BehaviorSubject<UserResponse>({
    id: 1,
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    role: 'USER',
    photoUrl: '/api/uploads/avatar.png',
  });

  const authServiceMock = {
    isLoggedIn: jasmine.createSpy('isLoggedIn').and.callFake(() => loggedIn),
    logout: jasmine.createSpy('logout'),
    currentUser$,
    getUser: jasmine.createSpy('getUser').and.callFake(() => currentUser$.getValue()),
  };

  const messagingServiceMock = {
    refreshUnreadCount: jasmine.createSpy('refreshUnreadCount'),
    resetUnreadCount: jasmine.createSpy('resetUnreadCount'),
    unreadCount$: new BehaviorSubject(3),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: MessagingService, useValue: messagingServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('shows guest actions when user is not authenticated', () => {
    loggedIn = false;

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Connexion');
    expect(text).toContain('Recherche');
    expect(text).not.toContain('Mes réservations');
    expect(text).not.toContain('Mes demandes');
  });

  it('shows authenticated actions when user is authenticated', () => {
    loggedIn = true;

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Mes réservations');
    expect(text).toContain('Profil');
    expect(messagingServiceMock.refreshUnreadCount).toHaveBeenCalled();
  });

  it('shows profile photo in profile button when available', () => {
    loggedIn = true;
    currentUser$.next({
      ...currentUser$.getValue(),
      photoUrl: '/api/uploads/avatar.png',
    });

    fixture.detectChanges();

    const profileImage = fixture.nativeElement.querySelector('button[aria-label="Menu profil"] img') as HTMLImageElement | null;
    expect(profileImage).not.toBeNull();
    expect(profileImage?.getAttribute('src')).toBe('/api/uploads/avatar.png');
  });

  it('falls back to initials when profile photo is missing', () => {
    loggedIn = true;
    currentUser$.next({
      ...currentUser$.getValue(),
      photoUrl: undefined,
    });

    fixture.detectChanges();

    const profileImage = fixture.nativeElement.querySelector('button[aria-label="Menu profil"] img') as HTMLImageElement | null;
    const fallback = fixture.nativeElement.querySelector('button[aria-label="Menu profil"] span[aria-hidden="true"]') as HTMLSpanElement | null;
    expect(profileImage).toBeNull();
    expect((fallback?.textContent ?? '').trim()).toBe('AL');
  });

  it('falls back to initials when profile image loading fails', () => {
    loggedIn = true;
    currentUser$.next({
      ...currentUser$.getValue(),
      photoUrl: '/api/uploads/broken-avatar.png',
    });

    fixture.detectChanges();

    const profileImage = fixture.nativeElement.querySelector('button[aria-label="Menu profil"] img') as HTMLImageElement;
    profileImage.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const fallback = fixture.nativeElement.querySelector('button[aria-label="Menu profil"] span[aria-hidden="true"]') as HTMLSpanElement | null;
    expect(fallback).not.toBeNull();
    expect((fallback?.textContent ?? '').trim()).toBe('AL');
  });

  it('opens profile dropdown with expected links', () => {
    loggedIn = true;

    fixture.detectChanges();

    const profileButton = fixture.nativeElement.querySelector('button[aria-label="Menu profil"]') as HTMLButtonElement;
    profileButton.click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Mon profil');
    expect(text).toContain('Mes demandes');
    expect(text).toContain('Messages');
    expect(text).toContain('Déconnexion');
  });

  it('logs out and resets unread counter', () => {
    loggedIn = true;

    fixture.detectChanges();
    const profileButton = fixture.nativeElement.querySelector('button[aria-label="Menu profil"]') as HTMLButtonElement;
    profileButton.click();
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const logoutButton = buttons.find((btn) => (btn.textContent ?? '').includes('Déconnexion'));

    expect(logoutButton).toBeDefined();
    logoutButton!.click();

    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(messagingServiceMock.resetUnreadCount).toHaveBeenCalled();
    expect(component.isProfileMenuOpen).toBeFalse();
  });

  it('toggles mobile menu state', () => {
    expect(component.isMobileMenuOpen).toBeFalse();

    component.toggleMobileMenu();
    expect(component.isMobileMenuOpen).toBeTrue();

    component.toggleMobileMenu();
    expect(component.isMobileMenuOpen).toBeFalse();
  });
});
