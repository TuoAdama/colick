import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AdminPage, AdminPublishedTrip, AdminTripBooking } from '../../models/admin.model';
import { adminDate } from './admin-display';
import { AdminLayoutComponent } from './admin-layout.component';
import { AdminTripBookingPageComponent } from './admin-trip-booking-page.component';
import { AdminTripDetailPageComponent } from './admin-trip-detail-page.component';
import { AdminTripsPageComponent } from './admin-trips-page.component';

const base = '/api/admin/trips';
const publication: AdminPublishedTrip = {
  trip: {
    id: 18, reference: 'REF-18', departureAddress: 'Paris', destination: 'Abidjan',
    departureTime: '2026-11-20T12:00:00', arrivalTime: '2026-11-20T18:00:00',
    maxWeight: 10, pricePerKilo: 8, status: 'ACTIVE',
  },
  travelerId: 7,
  travelerName: 'Ada Martin',
  createdAt: '2026-11-17T12:00:00',
};
const booking: AdminTripBooking = {
  id: 42, title: 'Documents', senderId: 9, senderName: 'Éloïse Durand', status: 'REMOVED',
};
const page = <T>(items: T[], page: number, totalPages = 3): AdminPage<T> =>
  ({ items, page, size: 20, totalElements: 20 * Math.max(0, totalPages - 1) + items.length, totalPages });

describe('Administration des trajets', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([{
        path: 'admin', component: AdminLayoutComponent, children: [
          { path: 'trips', component: AdminTripsPageComponent },
          { path: 'trips/:id/bookings/:bookingId', component: AdminTripBookingPageComponent },
          { path: 'trips/:id', component: AdminTripDetailPageComponent },
        ],
      }]),
    ] });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => http.verify());

  const paginated = (path: string, index: number) => `${path}?page=${index}&size=20`;
  const tripList = (index: number, sort = 'created_desc') => `${paginated(base, index)}&sort=${sort}`;
  const element = () => harness.routeNativeElement!;
  const button = (label: string, root: ParentNode = element()) =>
    Array.from(root.querySelectorAll('button')).find(item => item.textContent?.trim() === label)!;
  const link = (label: string) => Array.from(element().querySelectorAll('a'))
    .find(item => item.textContent?.trim().includes(label))!;

  it('exposes the trip section and follows URL pagination', async () => {
    await harness.navigateByUrl('/admin/trips?page=1');
    expect(element().querySelector('nav[aria-label="Rubriques de l’administration"] a[href="/admin/trips"]')).not.toBeNull();
    expect(element().textContent).toContain('Chargement des trajets');
    http.expectOne(tripList(1)).flush(page([publication], 1));
    harness.detectChanges();
    expect(link('Consulter').getAttribute('href')).toBe('/admin/trips/18?listPage=1');

    button('Suivant').click();
    await harness.fixture.whenStable();
    http.expectOne(tripList(2)).flush(page([{ ...publication, trip: { ...publication.trip, status: 'COMPLETED' } }], 2));
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/admin/trips?page=2');
    expect(element().textContent).toContain('Terminé');
    expect(button('Annuler le trajet')).toBeUndefined();
  });

  it('shows creation dates and toggles the server sort from the first page', async () => {
    await harness.navigateByUrl('/admin/trips?page=1');
    http.expectOne(tripList(1)).flush(page([publication], 1));
    harness.detectChanges();
    const header = element().querySelector('th[aria-sort]')!;
    const sortButton = header.querySelector('button')!;
    expect(sortButton.textContent).toContain('La date de création');
    expect(element().querySelector('thead')?.textContent).not.toContain('Référence');
    expect(element().querySelector('tbody td')?.textContent?.trim()).toBe(adminDate(publication.createdAt));
    expect(header.getAttribute('aria-sort')).toBe('descending');

    sortButton.click();
    await harness.fixture.whenStable();
    http.expectOne(tripList(0, 'created_asc')).flush(page([publication], 0));
    harness.detectChanges();
    expect(header.getAttribute('aria-sort')).toBe('ascending');
    expect(TestBed.inject(Router).url).toBe('/admin/trips?page=0&sort=created_asc');

    button('Suivant').click();
    await harness.fixture.whenStable();
    http.expectOne(tripList(1, 'created_asc')).flush(page([{ ...publication, createdAt: undefined }], 1));
    harness.detectChanges();
    expect(element().querySelector('tbody td')?.textContent?.trim()).toBe('Non disponible');
    expect(link('Consulter').getAttribute('href')).toBe('/admin/trips/18?listPage=1&listSort=created_asc');

    sortButton.click();
    await harness.fixture.whenStable();
    http.expectOne(tripList(0)).flush(page([publication], 0));
    harness.detectChanges();
    expect(header.getAttribute('aria-sort')).toBe('descending');
  });

  it('applies and resets both filters, keeping them on subsequent pages and in detail links', async () => {
    await harness.navigateByUrl('/admin/trips?page=1&sort=created_asc');
    http.expectOne(tripList(1, 'created_asc')).flush(page([publication], 1));
    await harness.fixture.whenStable();
    const date = element().querySelector<HTMLInputElement>('input[name="createdFrom"]')!;
    const query = element().querySelector<HTMLInputElement>('input[name="q"]')!;
    date.value = '2026-11-17';
    date.dispatchEvent(new Event('input'));
    query.value = '  Martin  ';
    query.dispatchEvent(new Event('input'));
    button('Filtrer').click();
    await harness.fixture.whenStable();
    const filters = '&createdFrom=2026-11-17&q=Martin';
    http.expectOne(tripList(0, 'created_asc') + filters).flush(page([publication], 0));
    harness.detectChanges();

    button('Suivant').click();
    await harness.fixture.whenStable();
    http.expectOne(tripList(1, 'created_asc') + filters).flush(page([publication], 1));
    harness.detectChanges();
    expect(link('Consulter').getAttribute('href'))
      .toBe('/admin/trips/18?listPage=1&listSort=created_asc&listCreatedFrom=2026-11-17&listQ=Martin');

    button('Réinitialiser').click();
    await harness.fixture.whenStable();
    http.expectOne(tripList(0, 'created_asc')).flush(page([publication], 0));
    harness.detectChanges();
    await harness.fixture.whenStable();
    expect(date.value).toBe('');
    expect(query.value).toBe('');
  });

  it('links the trip, its traveler and booking and preserves pagination, sort and filters', async () => {
    const listContext = 'listPage=2&listSort=created_asc&listCreatedFrom=2026-11-17&listQ=Martin';
    await harness.navigateByUrl('/admin/trips/18?' + listContext + '&page=1');
    http.expectOne(`${base}/18`).flush({ publication, meetingPoint: 'Gare du Nord', availableWeight: 8, instantAcceptance: true });
    http.expectOne(paginated(`${base}/18/bookings`, 1)).flush(page([booking], 1));
    harness.detectChanges();
    expect(element().textContent).toContain('Gare du Nord');
    expect(element().textContent).toContain('Automatique');
    expect(element().textContent).toContain('Retirée');
    expect(link('Ada Martin').getAttribute('href')).toBe('/admin/users/7');
    expect(link('Tous les trajets publiés').getAttribute('href'))
      .toBe('/admin/trips?page=2&sort=created_asc&createdFrom=2026-11-17&q=Martin');
    expect(link('Documents').getAttribute('href')).toBe('/admin/trips/18/bookings/42?' + listContext + '&page=1');

    await harness.navigateByUrl(link('Documents').getAttribute('href')!);
    const request = http.expectOne(`${base}/18/bookings/42`);
    expect(request.request.transferCache).toBeFalse();
    request.flush({
      booking, tripId: 18, tripReference: 'REF-18', recipientContact: 'recipient@example.test',
      description: 'Documents imprimés', hasPhoto: true,
    });
    harness.detectChanges();
    expect(element().textContent).toContain('recipient@example.test');
    expect(element().textContent).toContain('Documents imprimés');
    expect(element().querySelector('img')?.getAttribute('src')).toBe(`${base}/18/bookings/42/photo`);
    expect(link('Éloïse Durand').getAttribute('href')).toBe('/admin/users/9');
    expect(link('Retour au trajet').getAttribute('href')).toBe('/admin/trips/18?' + listContext + '&page=1');
  });

  it('cancels from the list only after confirmation and refreshes the current page', async () => {
    await harness.navigateByUrl('/admin/trips?page=1');
    http.expectOne(tripList(1)).flush(page([publication], 1));
    harness.detectChanges();
    button('Annuler le trajet').click();
    harness.detectChanges();
    button('Annuler', element().querySelector('[role=dialog]')!).click();
    harness.detectChanges();
    http.expectNone(`${base}/18`);
    expect(element().querySelector('[role=dialog]')).toBeNull();

    button('Annuler le trajet').click();
    harness.detectChanges();
    button('Confirmer l’annulation').click();
    const request = http.expectOne({ method: 'DELETE', url: `${base}/18` });
    request.flush(null, { status: 204, statusText: 'No Content' });
    http.expectOne(tripList(1)).flush(page([{ ...publication, trip: { ...publication.trip, status: 'CANCELLED' } }], 1));
    harness.detectChanges();
    expect(element().textContent).toContain('Le trajet REF-18 a été annulé.');
    expect(element().querySelector('tbody')?.textContent).toContain('Annulé');
    expect(button('Annuler le trajet')).toBeUndefined();
  });

  it('shows a conflict from the detail and refreshes the trip after dismissing the dialog', async () => {
    await harness.navigateByUrl('/admin/trips/18');
    http.expectOne(`${base}/18`).flush({ publication });
    http.expectOne(paginated(`${base}/18/bookings`, 0)).flush(page([], 0, 0));
    harness.detectChanges();
    expect(element().textContent).toContain('Aucune réservation associée');
    button('Annuler le trajet').click();
    harness.detectChanges();
    button('Confirmer l’annulation').click();
    http.expectOne({ method: 'DELETE', url: `${base}/18` }).flush(null, { status: 409, statusText: 'Conflict' });
    harness.detectChanges();
    expect(element().querySelector('[role=dialog] [role=alert]')?.textContent).toContain('Ce trajet ne peut plus être annulé');
    button('Annuler', element().querySelector('[role=dialog]')!).click();
    http.expectOne(`${base}/18`).flush({ publication: { ...publication, trip: { ...publication.trip, status: 'COMPLETED' } } });
    harness.detectChanges();
    expect(element().textContent).toContain('Terminé');
    expect(button('Annuler le trajet')).toBeUndefined();
  });

  it('shows a missing booking without rendering private data', async () => {
    await harness.navigateByUrl('/admin/trips/18/bookings/42');
    http.expectOne(`${base}/18/bookings/42`).flush(null, { status: 404, statusText: 'Not Found' });
    harness.detectChanges();
    expect(element().querySelector('[role=alert]')?.textContent).toContain('Réservation introuvable');
    expect(element().querySelector('img')).toBeNull();
  });
});
