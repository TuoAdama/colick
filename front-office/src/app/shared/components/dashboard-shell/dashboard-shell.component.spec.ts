import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
});
