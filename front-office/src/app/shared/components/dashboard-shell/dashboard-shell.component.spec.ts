import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { DashboardShellComponent } from './dashboard-shell.component';

describe('DashboardShellComponent', () => {
  let fixture: ComponentFixture<DashboardShellComponent>;

  const authServiceMock = {
    getUser: jasmine.createSpy('getUser').and.returnValue({
      id: 1,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      role: 'USER',
    }),
    logout: jasmine.createSpy('logout'),
  };

  beforeEach(async () => {
    authServiceMock.getUser.calls.reset();
    authServiceMock.logout.calls.reset();

    await TestBed.configureTestingModule({
      imports: [DashboardShellComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardShellComponent);
  });

  it('renders a compact dashboard footer with legal links', () => {
    fixture.detectChanges();

    const footer = fixture.nativeElement.querySelector('footer[role="contentinfo"]') as HTMLElement | null;
    const text = footer?.textContent ?? '';

    expect(footer).not.toBeNull();
    expect(text).toContain('Coliclic. Tous droits réservés.');
    expect(text).toContain('Confidentialité');
    expect(text).toContain('CGU');
    expect(text).toContain('Contact/support');
  });

  it('keeps the dashboard content flexible and the footer anchored after it', () => {
    fixture.detectChanges();

    const content = fixture.nativeElement.querySelector('.dashboard-content') as HTMLElement | null;
    const footer = fixture.nativeElement.querySelector('footer[role="contentinfo"]') as HTMLElement | null;

    expect(content?.classList.contains('flex-1')).toBeTrue();
    expect(content?.classList.contains('min-h-0')).toBeTrue();
    expect(footer?.classList.contains('shrink-0')).toBeTrue();
  });

  it('hides the footer on the reservations list route only', () => {
    const router = TestBed.inject(Router);
    spyOnProperty(router, 'url', 'get').and.returnValue('/trips/12/reservations');

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('footer[role="contentinfo"]')).toBeNull();
  });

  it('keeps the footer on reservation sub-pages', () => {
    const router = TestBed.inject(Router);
    spyOnProperty(router, 'url', 'get').and.returnValue('/trips/12/reservations/7/profile');

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('footer[role="contentinfo"]')).not.toBeNull();
  });

  it('renders the Coliclic dashboard logo', () => {
    fixture.detectChanges();

    const logo = fixture.nativeElement.querySelector('header a[routerLink="/"]') as HTMLAnchorElement | null;

    expect(logo).not.toBeNull();
    expect(logo?.textContent?.trim()).toBe('Coliclic');
  });

  it('shows the clarified navigation labels in the sidebar and mobile menu', () => {
    fixture.detectChanges();
    fixture.componentInstance.openMobileMenu();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent ?? '';
    const needsLinks = Array.from(host.querySelectorAll<HTMLAnchorElement>('a[href="/parcel-requests"]'))
      .filter((link) => link.textContent?.trim() === 'Mes besoins d’envoi');

    expect(text).toContain('Trajets publiés');
    expect(text).toContain('Demandes envoyées');
    expect(needsLinks.length).toBe(2);
    expect(text).not.toContain('Mes trajets');
    expect(text).not.toContain('Mes demandes');
    expect(text).not.toContain('Demandes de colis');
  });

  it('uses the route icon for published trips in both navigation menus', () => {
    fixture.componentInstance.openMobileMenu();
    fixture.detectChanges();

    const icons = fixture.nativeElement.querySelectorAll('[data-testid="published-trips-icon"]') as NodeListOf<SVGElement>;

    expect(icons.length).toBe(2);
    icons.forEach((icon) => {
      expect(icon.getAttribute('aria-hidden')).toBe('true');
      expect(icon.classList.contains('h-5')).toBeTrue();
      expect(icon.classList.contains('w-5')).toBeTrue();
      expect(icon.querySelector('circle[cx="5"][cy="19"]')).not.toBeNull();
      expect(icon.querySelector('circle[cx="19"][cy="5"]')).not.toBeNull();
      expect(icon.querySelector('path[d="M5 19c0-5.5 2.5-9 7-9h2c3 0 5-2 5-5"]')).not.toBeNull();
      expect(icon.querySelector('path[d="M3 7h18M6 3h12M6 21h12M4 10l2 8m14-8-2 8"]')).toBeNull();
    });
  });
});
