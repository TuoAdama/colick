import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Subject, of, throwError } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { AdminUserDetailPageComponent } from './admin-user-detail-page.component';
import { AdminUserActivityPageComponent } from './admin-user-activity-page.component';
import { AdminUsersPageComponent } from './admin-users-page.component';
import { AdminPage, AdminUser } from '../../models/admin.model';
import { adminDate, connectionLabels } from './admin-display';

const user: AdminUser = { id: 7, firstName: 'Ada', lastName: 'Admin', email: 'ada@test.com', verified: true, createdAtEstimated: true, connectionMethods: ['GOOGLE', 'PASSWORD'] };
const page = <T>(items: T[], totalPages = 1): AdminPage<T> => ({ items, page: 0, size: 20, totalElements: items.length, totalPages });

describe('Admin pages', () => {
  let service: jasmine.SpyObj<AdminService>;
  let harness: RouterTestingHarness;
  beforeEach(async () => {
    service = jasmine.createSpyObj('AdminService', ['users', 'detail', 'trips', 'bookings']);
    service.users.and.returnValue(of(page([user], 2)));
    service.detail.and.returnValue(of({ user, tripsCount: 2, bookingsCount: 3 }));
    service.trips.and.returnValue(of(page([{ id: 1, reference: 'REF-1', departureAddress: 'Paris', destination: 'Abidjan', departureTime: '2026-11-01T12:00:00', arrivalTime: '2026-11-01T18:00:00', maxWeight: 10, pricePerKilo: 8, status: 'CANCELLED' }])));
    service.bookings.and.returnValue(of(page([{ id: 2, title: 'Documents', tripId: 1, tripReference: 'REF-1', departureAddress: 'Paris', destination: 'Abidjan', status: 'REJECTED' }])));
    TestBed.configureTestingModule({ providers: [
      { provide: AdminService, useValue: service },
      provideRouter([
        { path: 'admin/users', component: AdminUsersPageComponent },
        { path: 'admin/users/:id/trips', component: AdminUserActivityPageComponent, data: { kind: 'trips' } },
        { path: 'admin/users/:id/bookings', component: AdminUserActivityPageComponent, data: { kind: 'bookings' } },
        { path: 'admin/users/:id', component: AdminUserDetailPageComponent },
      ]),
    ] });
    harness = await RouterTestingHarness.create();
  });

  it('renders methods and unknown/estimated dates, and links to the user', async () => {
    await harness.navigateByUrl('/admin/users', AdminUsersPageComponent);
    expect(harness.routeNativeElement?.textContent).toContain('Google · Mot de passe');
    expect(harness.routeNativeElement?.textContent).toContain('Non disponible');
    expect(harness.routeNativeElement?.textContent).toContain('Date estimée');
    expect(harness.routeNativeElement?.querySelector('tbody a')?.getAttribute('href')).toBe('/admin/users/7');
  });

  it('searches on the server, resets pagination and navigates to the next page', async () => {
    const component = await harness.navigateByUrl('/admin/users?page=3&q=old', AdminUsersPageComponent);
    component.query = ' Ada ';
    component.search();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(service.users).toHaveBeenCalledWith(0, 'Ada');
    const buttons = harness.routeNativeElement!.querySelectorAll('nav button');
    (buttons[1] as HTMLButtonElement).click();
    await harness.fixture.whenStable();
    expect(service.users).toHaveBeenCalledWith(1, 'Ada');
  });

  it('shows loading, a retryable error and then an empty result', async () => {
    const pending = new Subject<AdminPage<AdminUser>>();
    service.users.and.returnValue(pending);
    await harness.navigateByUrl('/admin/users', AdminUsersPageComponent);
    expect(harness.routeNativeElement?.querySelector('[role=status]')).not.toBeNull();
    pending.error(new Error('offline'));
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('[role=alert]')).not.toBeNull();
    service.users.and.returnValue(of(page([])));
    (harness.routeNativeElement!.querySelector('[role=alert] button') as HTMLButtonElement).click();
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Aucun utilisateur trouvé');
  });

  it('links counters to the full histories and renders verification', async () => {
    await harness.navigateByUrl('/admin/users/7', AdminUserDetailPageComponent);
    expect(harness.routeNativeElement?.textContent).toContain('Vérifié');
    const links = Array.from(harness.routeNativeElement!.querySelectorAll('a'));
    const trips = links.find(link => link.getAttribute('href') === '/admin/users/7/trips')!;
    expect(trips.textContent).toContain('2');
    trips.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(service.trips).toHaveBeenCalledWith(7, 0);
    expect(harness.routeNativeElement?.textContent).toContain('REF-1');
    expect(harness.routeNativeElement?.textContent).toContain('Annulé');
    await harness.navigateByUrl('/admin/users/7', AdminUserDetailPageComponent);
    const bookings = harness.routeNativeElement!.querySelector('a[href="/admin/users/7/bookings"]') as HTMLAnchorElement;
    expect(bookings.textContent).toContain('3');
    bookings.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(service.bookings).toHaveBeenCalledWith(7, 0);
    expect(harness.routeNativeElement?.textContent).toContain('Documents');
    expect(harness.routeNativeElement?.textContent).toContain('Refusée');
  });

  it('handles missing users and retries detail failures', async () => {
    service.detail.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    const component = await harness.navigateByUrl('/admin/users/7', AdminUserDetailPageComponent);
    expect(harness.routeNativeElement?.textContent).toContain('Utilisateur introuvable');
    service.detail.and.returnValue(of({ user: { ...user, verified: false }, tripsCount: 0, bookingsCount: 0 }));
    component.reload();
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Non vérifié');
  });

  it('shows activity loading, failure, retry and empty history', async () => {
    const pending = new Subject<AdminPage<never>>();
    service.bookings.and.returnValue(pending);
    const component = await harness.navigateByUrl('/admin/users/7/bookings', AdminUserActivityPageComponent);
    expect(harness.routeNativeElement?.textContent).toContain('Chargement');
    pending.error(new HttpErrorResponse({ status: 500 }));
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('[role=alert]')).not.toBeNull();
    service.bookings.and.returnValue(of(page([])));
    component.reload();
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Aucune demande envoyée');
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe('/admin/users/7');
  });

  it('cancels obsolete searches so late responses cannot overwrite the new page', async () => {
    const obsolete = new Subject<AdminPage<AdminUser>>();
    service.users.and.returnValue(obsolete);
    await harness.navigateByUrl('/admin/users?q=old', AdminUsersPageComponent);
    service.users.and.returnValue(of(page([])));
    await TestBed.inject(Router).navigateByUrl('/admin/users?q=new');
    obsolete.next(page([user]));
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Aucun utilisateur trouvé');
    expect(harness.routeNativeElement?.textContent).not.toContain(user.email);
  });
});

describe('Admin display', () => {
  it('formats dates and single or mixed methods', () => {
    expect(adminDate()).toBe('Non disponible');
    expect(adminDate('2026-10-30T12:00:00')).toContain('2026');
    expect(connectionLabels({ ...user, connectionMethods: ['PASSWORD'] })).toBe('Mot de passe');
    expect(connectionLabels({ ...user, connectionMethods: ['GOOGLE'] })).toBe('Google');
  });
});
