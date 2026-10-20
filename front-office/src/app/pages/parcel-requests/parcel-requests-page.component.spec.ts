import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NEVER, of, throwError } from 'rxjs';
import { ParcelRequestService } from '../../services/parcel-request.service';
import { ParcelRequestDetailPageComponent } from '../parcel-request-detail/parcel-request-detail-page.component';
import { ParcelRequestsPageComponent } from './parcel-requests-page.component';

describe('ParcelRequestsPageComponent', () => {
  let fixture: ComponentFixture<ParcelRequestsPageComponent>;
  const request = { id: 1, senderId: 10, senderName: 'Alice', departure: 'Paris', destination: 'Abidjan', desiredDate: '2026-07-01', packageTitle: 'Documents', weight: 2, status: 'ACTIVE' as const, description: 'Fragile', packagePhotoUrl: '/photo.png', createdAt: '2026-06-01T12:00:00' };
  let service: jasmine.SpyObj<ParcelRequestService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj('ParcelRequestService', ['getMyRequests', 'getMyRequest', 'closeRequest']);
    service.getMyRequests.and.returnValue(of([]));
    service.getMyRequest.and.returnValue(of(request));
    service.closeRequest.and.returnValue(of({ ...request, status: 'CLOSED' }));
    await TestBed.configureTestingModule({
      imports: [ParcelRequestsPageComponent],
      providers: [provideRouter([
        { path: 'parcel-requests', component: ParcelRequestsPageComponent },
        { path: 'parcel-requests/:id', component: ParcelRequestDetailPageComponent },
      ]), { provide: ParcelRequestService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(ParcelRequestsPageComponent);
  });

  it('renders ordered, linked summaries without management controls or tabs', () => {
    service.getMyRequests.and.returnValue(of([request, { ...request, id: 2, status: 'CLOSED' }, { ...request, id: 3, status: 'CANCELLED', desiredDate: undefined }]));
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(Array.from(host.querySelectorAll('section a')).map(a => a.getAttribute('href'))).toEqual(['/parcel-requests/1', '/parcel-requests/2', '/parcel-requests/3']);
    for (const text of ['Paris → Abidjan', 'Documents · 2 kg', 'Active', 'Trouvée', 'Annulée', 'Date flexible']) expect(host.textContent).toContain(text);
    for (const text of ['Marquer trouvée', 'Annuler', 'Publiée le', 'Fragile']) expect(host.textContent).not.toContain(text);
    expect(host.querySelector('[role="tablist"]')).toBeNull();
    expect(host.querySelector('section button')).toBeNull();
    expect(host.querySelector('img')).toBeNull();
    expect(host.querySelector('section a')?.className).toContain('focus-visible:outline');
  });

  it('shows an empty state and creation links', () => {
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent).toContain('Retrouvez et suivez vos demandes d’envoi.');
    expect(host.textContent).toContain('Vous n’avez encore créé aucun besoin d’envoi.');
    expect(host.querySelectorAll('a[href="/parcel-requests/new"]').length).toBe(2);
  });

  it('shows loading without a premature empty state', () => {
    service.getMyRequests.and.returnValue(NEVER);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('aucun besoin');
  });

  it('retries a load failure without showing an empty state', () => {
    service.getMyRequests.and.returnValue(throwError(() => new Error('offline')));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('aucun besoin');
    service.getMyRequests.and.returnValue(of([request]));
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Paris → Abidjan');
  });

  it('navigates from a card to its detail, closes it and reloads the list on return', async () => {
    service.getMyRequests.and.returnValue(of([request]));
    const harness = await RouterTestingHarness.create('/parcel-requests');
    (harness.routeNativeElement!.querySelector('a[href="/parcel-requests/1"]') as HTMLAnchorElement).click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(service.getMyRequest).toHaveBeenCalledWith(1);
    const close = Array.from(harness.routeNativeElement!.querySelectorAll('button')).find(b => b.textContent?.includes('Marquer trouvée'))!;
    close.click();
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Trouvée');
    service.getMyRequests.and.returnValue(of([{ ...request, status: 'CLOSED' }]));
    (harness.routeNativeElement!.querySelector('a[href="/parcel-requests"]') as HTMLAnchorElement).click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(service.getMyRequests).toHaveBeenCalledTimes(2);
    expect(harness.routeNativeElement!.textContent).toContain('Trouvée');
  });
});
