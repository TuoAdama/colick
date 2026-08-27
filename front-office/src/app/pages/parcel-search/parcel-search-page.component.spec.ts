import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LocationService } from '../../services/location.service';
import { MessagingService } from '../../services/messaging.service';
import { ParcelRequestService } from '../../services/parcel-request.service';
import { ParcelSearchPageComponent } from './parcel-search-page.component';

describe('ParcelSearchPageComponent', () => {
  let fixture: ComponentFixture<ParcelSearchPageComponent>;
  let component: ParcelSearchPageComponent;
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParcelSearchPageComponent],
      providers: [
        provideRouter([{ path: 'parcel-search', component: ParcelSearchPageComponent }]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: LocationService, useValue: locationServiceMock },
        { provide: MessagingService, useValue: messagingServiceMock },
        { provide: ParcelRequestService, useValue: parcelRequestServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    authServiceMock.isLoggedIn.and.returnValue(true);
    locationServiceMock.searchLocations.calls.reset();
    messagingServiceMock.createConversationDraft.calls.reset();
    messagingServiceMock.createConversationDraft.and.returnValue(of({ id: 99 }));
    parcelRequestServiceMock.getAvailableRequests.calls.reset();
    parcelRequestServiceMock.getAvailableRequests.and.returnValue(of([parcelRequest]));
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(ParcelSearchPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('reads query params and searches available parcel requests', async () => {
    await router.navigateByUrl('/parcel-search?from=Paris&to=Abidjan&date=2026-07-01');

    createComponent();

    expect(parcelRequestServiceMock.getAvailableRequests).toHaveBeenCalledWith({
      departure: 'Paris',
      destination: 'Abidjan',
      date: '2026-07-01',
    });
    expect(fixture.nativeElement.textContent).toContain('Demande colis');
    expect(fixture.nativeElement.textContent).toContain('Depart');
    expect(fixture.nativeElement.textContent).toContain('Arrivee');
    expect(fixture.nativeElement.textContent).toContain('01 juil. 2026');
    expect(fixture.nativeElement.textContent).toContain('Documents · 2kg');
  });

  it('loads parcel requests for unauthenticated users', async () => {
    authServiceMock.isLoggedIn.and.returnValue(false);
    await router.navigateByUrl('/parcel-search?from=Paris&to=Abidjan');

    createComponent();

    expect(router.navigate).not.toHaveBeenCalledWith(['/login']);
    expect(parcelRequestServiceMock.getAvailableRequests).toHaveBeenCalledWith({
      departure: 'Paris',
      destination: 'Abidjan',
      date: '',
    });
    expect(fixture.nativeElement.textContent).toContain('Demande colis');
  });

  it('submits a parcel request search for unauthenticated users', async () => {
    authServiceMock.isLoggedIn.and.returnValue(false);
    await router.navigateByUrl('/parcel-search?from=Paris&to=Abidjan');
    createComponent();
    parcelRequestServiceMock.getAvailableRequests.calls.reset();

    component.searchRequests();

    expect(parcelRequestServiceMock.getAvailableRequests).toHaveBeenCalledWith({
      departure: 'Paris',
      destination: 'Abidjan',
      date: '',
    });
    expect(router.navigate).not.toHaveBeenCalledWith(['/login']);
  });

  it('updates the URL when submitting a new parcel request search', () => {
    createComponent();
    component.departure = { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' };
    component.destination = { id: 2, name: 'Abidjan', country: "Côte d'Ivoire", isoCode: 'CI', type: 'CITY' };
    component.selectedDate = '2026-07-01';

    component.searchRequests();

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: jasmine.anything(),
      queryParams: {
        from: 'Paris',
        to: 'Abidjan',
        date: '2026-07-01',
      },
    });
  });

  it('opens a conversation from a parcel request result', async () => {
    await router.navigateByUrl('/parcel-search?from=Paris&to=Abidjan');

    createComponent();
    component.contactSender(component.requests[0]);

    expect(messagingServiceMock.createConversationDraft).toHaveBeenCalledWith({
      parcelRequestId: 12,
      recipientId: 7,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/messages'], { queryParams: { conversationId: 99 } });
  });

  it('redirects unauthenticated users to login with a return URL before contacting', async () => {
    authServiceMock.isLoggedIn.and.returnValue(false);
    await router.navigateByUrl('/parcel-search?from=Paris&to=Abidjan');
    createComponent();
    messagingServiceMock.createConversationDraft.calls.reset();

    component.contactSender(component.requests[0]);

    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/parcel-search?from=Paris&to=Abidjan' },
    });
    expect(messagingServiceMock.createConversationDraft).not.toHaveBeenCalled();
  });

  it('shows an empty state after a search without results', async () => {
    parcelRequestServiceMock.getAvailableRequests.and.returnValue(of([]));
    await router.navigateByUrl('/parcel-search?from=Paris&to=Abidjan');

    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Aucune demande trouvee.');
  });

  it('shows an error state when parcel request search fails', async () => {
    parcelRequestServiceMock.getAvailableRequests.and.returnValue(throwError(() => new Error('failed')));
    await router.navigateByUrl('/parcel-search?from=Paris&to=Abidjan');

    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Impossible de charger les demandes de colis.');
  });

  it('renders Date flexible in the same date chip when desiredDate is missing', async () => {
    parcelRequestServiceMock.getAvailableRequests.and.returnValue(of([
      {
        ...parcelRequest,
        desiredDate: undefined,
      },
    ]));
    await router.navigateByUrl('/parcel-search?from=Paris&to=Abidjan');

    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Date flexible');
  });
});
