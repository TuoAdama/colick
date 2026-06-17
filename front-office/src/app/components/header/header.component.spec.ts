import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { UserResponse } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';
import { MessagingService } from '../../services/messaging.service';
import { HeaderComponent } from './header.component';

/** Authenticated user fixture */
const AUTHENTICATED_USER: UserResponse = {
  id: 1,
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  role: 'USER',
  photoUrl: '/api/uploads/avatar.png',
};

@Component({
  standalone: true,
  template: '',
})
class TestRouteComponent {}

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;
  let router: Router;

  // Drive auth state via currentUser$ so the template reacts reactively
  const currentUser$ = new BehaviorSubject<UserResponse | null>(null);

  const authServiceMock = {
    /**
     * isLoggedIn() is only used inside ngOnInit — keep it in sync with
     * the BehaviorSubject so both code paths are consistent.
     */
    isLoggedIn: jasmine.createSpy('isLoggedIn').and.callFake(() => currentUser$.getValue() !== null),
    logout: jasmine.createSpy('logout').and.callFake(() => currentUser$.next(null)),
    currentUser$,
    getUser: jasmine.createSpy('getUser').and.callFake(() => currentUser$.getValue()),
  };

  const messagingServiceMock = {
    refreshUnreadCount: jasmine.createSpy('refreshUnreadCount'),
    resetUnreadCount: jasmine.createSpy('resetUnreadCount'),
    unreadCount$: new BehaviorSubject(3),
  };

  beforeEach(async () => {
    // Reset spies and auth state before each test
    authServiceMock.logout.calls.reset();
    authServiceMock.isLoggedIn.calls.reset();
    authServiceMock.getUser.calls.reset();
    messagingServiceMock.refreshUnreadCount.calls.reset();
    messagingServiceMock.resetUnreadCount.calls.reset();
    currentUser$.next(null);

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([
          { path: '', component: TestRouteComponent },
          { path: 'search', component: TestRouteComponent },
          { path: 'parcel-search', component: TestRouteComponent },
          { path: 'propose', component: TestRouteComponent },
        ]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: MessagingService, useValue: messagingServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('shows guest actions when user is not authenticated', () => {
    // currentUser$ emits null — template must show guest UI
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Connexion');
    expect(text).not.toContain('Recherche');
    expect(text).not.toContain('Mes réservations');
    expect(text).not.toContain('Mes demandes');
  });

  it('marks search navigation as active on the search route', async () => {
    await router.navigateByUrl('/search');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    const searchLink = links.find((link) => (link.textContent ?? '').trim() === 'Trouver un trajet');

    expect(searchLink).toBeDefined();
    expect(searchLink?.className).toContain('text-primary');
    expect(searchLink?.className).toContain('underline');
  });

  it('marks parcel navigation as active on the parcel search route', async () => {
    await router.navigateByUrl('/parcel-search?from=Nantes&to=Yamoussoukro');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    const parcelLink = links.find((link) => (link.textContent ?? '').trim() === 'Transporter un colis');
    const searchLink = links.find((link) => (link.textContent ?? '').trim() === 'Trouver un trajet');

    expect(parcelLink).toBeDefined();
    expect(parcelLink?.className).toContain('text-primary');
    expect(parcelLink?.className).toContain('underline');
    expect(searchLink?.className).not.toContain('text-primary');
  });

  it('keeps parcel navigation active on the propose route', async () => {
    await router.navigateByUrl('/propose');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    const parcelLink = links.find((link) => (link.textContent ?? '').trim() === 'Transporter un colis');

    expect(parcelLink).toBeDefined();
    expect(parcelLink?.className).toContain('text-primary');
    expect(parcelLink?.className).toContain('underline');
  });

  it('shows authenticated actions when user is authenticated', () => {
    currentUser$.next(AUTHENTICATED_USER);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Mes réservations');
    expect(text).toContain('Profil');
    expect(messagingServiceMock.refreshUnreadCount).toHaveBeenCalled();
  });

  it('reactively switches to guest view after logout', () => {
    // Start authenticated
    currentUser$.next(AUTHENTICATED_USER);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Mes réservations');

    // Simulate logout by emitting null from currentUser$
    currentUser$.next(null);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Connexion');
    expect(text).not.toContain('Mes réservations');
  });

  it('shows profile photo in profile button when available', () => {
    currentUser$.next({ ...AUTHENTICATED_USER, photoUrl: '/api/uploads/avatar.png' });
    fixture.detectChanges();

    const profileImage = fixture.nativeElement.querySelector('button[aria-label="Menu profil"] img') as HTMLImageElement | null;
    expect(profileImage).not.toBeNull();
    expect(profileImage?.getAttribute('src')).toBe('/api/uploads/avatar.png');
  });

  it('falls back to initials when profile photo is missing', () => {
    currentUser$.next({ ...AUTHENTICATED_USER, photoUrl: undefined });
    fixture.detectChanges();

    const profileImage = fixture.nativeElement.querySelector('button[aria-label="Menu profil"] img') as HTMLImageElement | null;
    const fallback = fixture.nativeElement.querySelector('button[aria-label="Menu profil"] span[aria-hidden="true"]') as HTMLSpanElement | null;
    expect(profileImage).toBeNull();
    expect((fallback?.textContent ?? '').trim()).toBe('AL');
  });

  it('falls back to initials when profile image loading fails', () => {
    currentUser$.next({ ...AUTHENTICATED_USER, photoUrl: '/api/uploads/broken-avatar.png' });
    fixture.detectChanges();

    const profileImage = fixture.nativeElement.querySelector('button[aria-label="Menu profil"] img') as HTMLImageElement;
    profileImage.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const fallback = fixture.nativeElement.querySelector('button[aria-label="Menu profil"] span[aria-hidden="true"]') as HTMLSpanElement | null;
    expect(fallback).not.toBeNull();
    expect((fallback?.textContent ?? '').trim()).toBe('AL');
  });

  it('opens profile dropdown with expected links', () => {
    currentUser$.next(AUTHENTICATED_USER);
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
    currentUser$.next(AUTHENTICATED_USER);
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
