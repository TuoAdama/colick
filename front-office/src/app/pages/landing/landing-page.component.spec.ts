import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LocationService } from '../../services/location.service';
import { MessagingService } from '../../services/messaging.service';
import { ParcelRequestService } from '../../services/parcel-request.service';
import { TripService } from '../../services/trip.service';
import { LandingPageComponent } from './landing-page.component';

describe('LandingPageComponent', () => {
  let fixture: ComponentFixture<LandingPageComponent>;
  let component: LandingPageComponent;
  let router: Router;

  const parcelRequest = {
    id: 12,
    senderId: 7,
    senderName: 'Alice Sender',
    departure: 'Paris',
    destination: 'Abidjan',
    desiredDate: '2026-07-01',
    packageTitle: 'Documents',
    weight: 2,
    description: 'Petit colis fragile',
    status: 'ACTIVE' as const,
  };

  const authServiceMock = {
    isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
  };

  const locationServiceMock = {
    searchLocations: jasmine.createSpy('searchLocations').and.returnValue(of([])),
  };

  const messagingServiceMock = {
    createConversationDraft: jasmine.createSpy('createConversationDraft').and.returnValue(of({ id: 99 })),
  };

  const parcelRequestServiceMock = {
    getAvailableRequests: jasmine.createSpy('getAvailableRequests').and.returnValue(of([parcelRequest])),
  };

  const tripServiceMock = {
    getLandingFeed: jasmine.createSpy('getLandingFeed').and.returnValue(of([])),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: LocationService, useValue: locationServiceMock },
        { provide: MessagingService, useValue: messagingServiceMock },
        { provide: ParcelRequestService, useValue: parcelRequestServiceMock },
        { provide: TripService, useValue: tripServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    authServiceMock.isLoggedIn.and.returnValue(true);
    messagingServiceMock.createConversationDraft.calls.reset();
    messagingServiceMock.createConversationDraft.and.returnValue(of({ id: 99 }));
    parcelRequestServiceMock.getAvailableRequests.calls.reset();
    parcelRequestServiceMock.getAvailableRequests.and.returnValue(of([parcelRequest]));
    tripServiceMock.getLandingFeed.calls.reset();
    tripServiceMock.getLandingFeed.and.returnValue(of([]));
  });

  it('shows a transport search form with route and desired date fields', () => {
    fixture.detectChanges();

    component.selectMode('transport');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Date souhaitee');
    expect(fixture.nativeElement.textContent).toContain('Voir les demandes');
    expect(fixture.nativeElement.textContent).toContain('Publier un trajet');
  });

  it('searches parcel requests with departure, destination and date', () => {
    fixture.detectChanges();
    component.selectMode('transport');
    component.departure = { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' };
    component.destination = { id: 2, name: 'Abidjan', country: "Côte d'Ivoire", isoCode: 'CI', type: 'CITY' };
    component.travelDate = '2026-07-01';

    component.searchParcelRequests();
    fixture.detectChanges();

    expect(parcelRequestServiceMock.getAvailableRequests).toHaveBeenCalledWith({
      departure: 'Paris',
      destination: 'Abidjan',
      date: '2026-07-01',
    });
    expect(fixture.nativeElement.textContent).toContain('Demande colis');
    expect(fixture.nativeElement.textContent).toContain('Documents · 2kg');
  });

  it('opens a conversation from a parcel request result', () => {
    fixture.detectChanges();
    component.selectMode('transport');
    component.searchParcelRequests();

    component.contactSender(component.parcelRequests[0]);

    expect(messagingServiceMock.createConversationDraft).toHaveBeenCalledWith({
      parcelRequestId: 12,
      recipientId: 7,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/messages'], { queryParams: { conversationId: 99 } });
  });

  it('shows an empty state after a search without results', () => {
    parcelRequestServiceMock.getAvailableRequests.and.returnValue(of([]));
    fixture.detectChanges();
    component.selectMode('transport');

    component.searchParcelRequests();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aucune demande trouvee.');
  });

  it('shows an error state when parcel request search fails', () => {
    parcelRequestServiceMock.getAvailableRequests.and.returnValue(throwError(() => new Error('failed')));
    fixture.detectChanges();
    component.selectMode('transport');

    component.searchParcelRequests();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Impossible de charger les demandes de colis.');
  });

  it('redirects unauthenticated users to login when searching parcel requests', () => {
    authServiceMock.isLoggedIn.and.returnValue(false);
    fixture.detectChanges();
    component.selectMode('transport');

    component.searchParcelRequests();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(parcelRequestServiceMock.getAvailableRequests).not.toHaveBeenCalled();
  });
});
