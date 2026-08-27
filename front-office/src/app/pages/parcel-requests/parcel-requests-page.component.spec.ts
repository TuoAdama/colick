import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NEVER, of } from 'rxjs';
import { ParcelRequestService } from '../../services/parcel-request.service';
import { ParcelRequestsPageComponent } from './parcel-requests-page.component';

describe('ParcelRequestsPageComponent', () => {
  let fixture: ComponentFixture<ParcelRequestsPageComponent>;
  let component: ParcelRequestsPageComponent;

  const myRequest = {
    id: 1,
    senderId: 10,
    senderName: 'Alice Sender',
    departure: 'Paris',
    destination: 'Abidjan',
    desiredDate: '2026-07-01',
    packageTitle: 'Documents',
    weight: 2,
    status: 'ACTIVE' as const,
  };

  const parcelRequestServiceMock = {
    getMyRequests: jasmine.createSpy('getMyRequests').and.returnValue(of([])),
    closeRequest: jasmine.createSpy('closeRequest').and.returnValue(of({ ...myRequest, status: 'CLOSED' })),
    cancelRequest: jasmine.createSpy('cancelRequest').and.returnValue(of(void 0)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParcelRequestsPageComponent],
      providers: [
        provideRouter([]),
        { provide: ParcelRequestService, useValue: parcelRequestServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ParcelRequestsPageComponent);
    component = fixture.componentInstance;
    spyOn(window, 'confirm').and.returnValue(true);
    parcelRequestServiceMock.getMyRequests.calls.reset();
    parcelRequestServiceMock.getMyRequests.and.returnValue(of([]));
    parcelRequestServiceMock.closeRequest.calls.reset();
    parcelRequestServiceMock.closeRequest.and.returnValue(of({ ...myRequest, status: 'CLOSED' }));
    parcelRequestServiceMock.cancelRequest.calls.reset();
    parcelRequestServiceMock.cancelRequest.and.returnValue(of(void 0));
  });

  it('loads my requests on init', () => {
    parcelRequestServiceMock.getMyRequests.and.returnValue(of([myRequest]));

    fixture.detectChanges();

    expect(parcelRequestServiceMock.getMyRequests).toHaveBeenCalled();
    expect(component.myRequests.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Paris → Abidjan');
    expect(fixture.nativeElement.textContent).toContain('Documents');
    expect(fixture.nativeElement.textContent).not.toContain('Demandes disponibles');
  });

  it('shows an empty state when the user has no publications', () => {
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const links = Array.from(host.querySelectorAll<HTMLAnchorElement>('a[href="/parcel-requests/new"]'));

    expect(host.textContent).toContain('Mes besoins d’envoi');
    expect(host.textContent).toContain('Publiez un besoin d’envoi pour trouver un voyageur qui effectue le même trajet, puis suivez ici l’état de votre recherche.');
    expect(host.textContent).toContain('Vous n’avez encore créé aucun besoin d’envoi.');
    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Publier un besoin',
      'Créer mon premier besoin',
    ]);
    expect(links[0].classList).toContain('shrink-0');
    expect(links[0].classList).toContain('whitespace-nowrap');
  });

  it('shows a loading indicator while publications are loading', () => {
    parcelRequestServiceMock.getMyRequests.and.returnValue(NEVER);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.animate-spin')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Vous n’avez encore créé aucun besoin d’envoi.');
  });

  it('closes one of my active requests', () => {
    component.myRequests = [myRequest];

    component.closeRequest(myRequest);

    expect(parcelRequestServiceMock.closeRequest).toHaveBeenCalledWith(1);
    expect(component.myRequests[0].status).toBe('CLOSED');
  });

  it('cancels one of my active requests', () => {
    component.myRequests = [myRequest];

    component.cancelRequest(myRequest);

    expect(parcelRequestServiceMock.cancelRequest).toHaveBeenCalledWith(1);
    expect(component.myRequests[0].status).toBe('CANCELLED');
  });
});
