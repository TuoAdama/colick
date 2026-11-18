import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContactPageComponent } from '../contact/contact-page.component';
import { AdminDisputeDetailPageComponent } from './admin-dispute-detail-page.component';
import { AdminDisputesPageComponent } from './admin-disputes-page.component';

describe('Dispute submission and administration', () => {
  const summary = {
    id: 7,
    receivedAt: '2026-11-18T12:00:00Z',
    email: 'ada@example.com',
    tripReference: 'TRIP-1',
  };
  const page = { items: [summary], page: 1, size: 20, totalElements: 21, totalPages: 2 };
  const description = 'Le colis est arrivé endommagé.\nMerci de vérifier.';
  let harness: RouterTestingHarness;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([
        { path: 'annulation-litiges/formulaire', component: ContactPageComponent, data: { contactMode: 'dispute' } },
        { path: 'admin/disputes', component: AdminDisputesPageComponent },
        { path: 'admin/disputes/:id', component: AdminDisputeDetailPageComponent },
      ]),
    ] });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => http.verify());

  it('submits the form, reads the dossier from the table and returns to the same page', async () => {
    const form = await harness.navigateByUrl('/annulation-litiges/formulaire', ContactPageComponent);
    form.contactForm.patchValue({ email: summary.email, tripReference: ' TRIP-1 ', message: description });
    harness.routeNativeElement!.querySelector('form')!.dispatchEvent(new Event('submit'));
    const submission = http.expectOne({ method: 'POST', url: '/api/disputes' });
    expect(JSON.parse(submission.request.serializeBody() as string)).toEqual({
      email: summary.email, tripReference: 'TRIP-1', description,
    });
    submission.flush(null, { status: 204, statusText: 'No Content' });
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Votre réclamation a bien été envoyée.');

    await harness.navigateByUrl('/admin/disputes?page=1', AdminDisputesPageComponent);
    http.expectOne('/api/admin/disputes?page=1&size=20').flush(page);
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('tbody')!.textContent).toContain(summary.email);
    const detailLink = harness.routeNativeElement!.querySelector<HTMLAnchorElement>('tbody a')!;
    expect(detailLink.textContent).toContain('Voir le détail');
    expect(detailLink.getAttribute('href')).toBe('/admin/disputes/7?page=1');

    await harness.navigateByUrl(detailLink.getAttribute('href')!, AdminDisputeDetailPageComponent);
    http.expectOne('/api/admin/disputes/7').flush({ ...summary, description });
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain(description);
    expect(harness.routeNativeElement!.textContent).toContain('Non renseignée');
    const backLink = harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a')!;
    expect(backLink.getAttribute('href')).toBe('/admin/disputes?page=1');

    await harness.navigateByUrl(backLink.getAttribute('href')!, AdminDisputesPageComponent);
    http.expectOne('/api/admin/disputes?page=1&size=20').flush(page);
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Page 2 sur 2');
  });

  it('shows loading, an error and an empty list after retry', async () => {
    await harness.navigateByUrl('/admin/disputes', AdminDisputesPageComponent);
    expect(harness.routeNativeElement!.querySelector('[role="status"]')!.textContent).toContain('Chargement');
    http.expectOne('/api/admin/disputes?page=0&size=20').flush(null, { status: 500, statusText: 'Error' });
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('[role="alert"]')!.textContent).toContain('Impossible');
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('button')!.click();
    http.expectOne('/api/admin/disputes?page=0&size=20').flush({
      ...page, items: [], page: 0, totalElements: 0, totalPages: 0,
    });
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Aucun litige reçu.');
  });

  it('shows when a dossier no longer exists', async () => {
    await harness.navigateByUrl('/admin/disputes/999', AdminDisputeDetailPageComponent);
    http.expectOne('/api/admin/disputes/999').flush(null, { status: 404, statusText: 'Not Found' });
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('[role="alert"]')!.textContent).toContain('Litige introuvable.');
  });
});
