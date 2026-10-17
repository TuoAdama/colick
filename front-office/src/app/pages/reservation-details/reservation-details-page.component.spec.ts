import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { BookingResponse } from '../../models/booking.model';
import { Trip } from '../../models/trip.model';
import { MessagingService } from '../../services/messaging.service';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { ShareCardMapperService } from '../../services/share-card-mapper.service';
import { ShareCardExportService } from '../../services/share-card-export.service';
import { ReservationDetailsPageComponent } from './reservation-details-page.component';

describe('ReservationDetailsPageComponent', () => {
  let fixture: ComponentFixture<ReservationDetailsPageComponent>;
  let component: ReservationDetailsPageComponent;
  let router: Router;

  const tripParamMap$ = new BehaviorSubject(convertToParamMap({ tripId: '12' }));

  const tripServiceMock = {
    getTripById: jasmine.createSpy('getTripById'),
    getTripBookings: jasmine.createSpy('getTripBookings'),
    acceptBooking: jasmine.createSpy('acceptBooking'),
    rejectBooking: jasmine.createSpy('rejectBooking'),
    removeBooking: jasmine.createSpy('removeBooking'),
    completeTrip: jasmine.createSpy('completeTrip'),
    cancelTrip: jasmine.createSpy('cancelTrip'),
    confirmBookingDelivery: jasmine.createSpy('confirmBookingDelivery'),
  };

  const messagingServiceMock = {
    startConversation: jasmine.createSpy('startConversation'),
    createConversationDraft: jasmine.createSpy('createConversationDraft'),
  };

  const authServiceMock = {
    getUser: jasmine.createSpy('getUser').and.returnValue({
      id: 1,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      hasPassword: true,
      photoUrl: null,
    }),
    logout: jasmine.createSpy('logout'),
  };

  const shareCardMapperServiceMock = {
    mapActiveTripToShareCard: jasmine.createSpy('mapActiveTripToShareCard'),
    buildFileDate: jasmine.createSpy('buildFileDate'),
  };

  const shareCardExportServiceMock = {
    generateQrCodeDataUrl: jasmine.createSpy('generateQrCodeDataUrl'),
    captureElementAsPngFile: jasmine.createSpy('captureElementAsPngFile'),
    downloadFile: jasmine.createSpy('downloadFile'),
  };

  beforeEach(async () => {
    tripParamMap$.next(convertToParamMap({ tripId: '12' }));
    tripServiceMock.getTripById.calls.reset();
    tripServiceMock.getTripBookings.calls.reset();
    tripServiceMock.acceptBooking.calls.reset();
    tripServiceMock.rejectBooking.calls.reset();
    tripServiceMock.removeBooking.calls.reset();
    tripServiceMock.completeTrip.calls.reset();
    tripServiceMock.cancelTrip.calls.reset();
    tripServiceMock.confirmBookingDelivery.calls.reset();
    messagingServiceMock.startConversation.calls.reset();
    messagingServiceMock.createConversationDraft.calls.reset();
    authServiceMock.getUser.calls.reset();
    authServiceMock.logout.calls.reset();
    shareCardMapperServiceMock.mapActiveTripToShareCard.calls.reset();
    shareCardMapperServiceMock.buildFileDate.calls.reset();
    shareCardExportServiceMock.generateQrCodeDataUrl.calls.reset();
    shareCardExportServiceMock.captureElementAsPngFile.calls.reset();
    shareCardExportServiceMock.downloadFile.calls.reset();

    tripServiceMock.getTripById.and.returnValue(of(buildTrip()));
    tripServiceMock.getTripBookings.and.returnValue(of([buildBooking()]));
    tripServiceMock.acceptBooking.and.returnValue(of({ ...buildBooking(), status: 'ACCEPTED' }));
    tripServiceMock.rejectBooking.and.returnValue(of({ ...buildBooking(), status: 'REJECTED' }));
    tripServiceMock.removeBooking.and.returnValue(of(void 0));
    tripServiceMock.completeTrip.and.returnValue(of({ ...buildTrip(), status: 'COMPLETED' }));
    tripServiceMock.cancelTrip.and.returnValue(of(void 0));
    tripServiceMock.confirmBookingDelivery.and.returnValue(of({
      ...buildBooking(),
      status: 'ACCEPTED',
      validationCodeActive: false,
      deliveredAt: '2025-07-15T10:00:00',
    }));
    messagingServiceMock.startConversation.and.returnValue(of({
      id: 1,
      tripId: 12,
      tripRoute: 'Paris → Abidjan',
      otherParticipantId: 55,
      otherParticipantName: 'Grace Hopper',
      lastMessage: 'Bonjour',
      unreadCount: 0,
      createdAt: '2025-07-15T09:00:00',
    }));
    messagingServiceMock.createConversationDraft.and.returnValue(of({
      id: 1,
      tripId: 12,
      tripRoute: 'Paris → Abidjan',
      otherParticipantId: 55,
      otherParticipantName: 'Grace Hopper',
      lastMessage: null,
      unreadCount: 0,
      createdAt: '2025-07-15T09:00:00',
    }));
    shareCardMapperServiceMock.mapActiveTripToShareCard.and.returnValue({
      departureCity: 'Paris',
      destinationCity: 'Abidjan',
      routeLabel: 'Paris → Abidjan',
      formattedDate: '14 Juillet 2025',
      formattedTime: '08:00',
      formattedArrivalDate: '14 Juillet 2025',
      formattedArrivalTime: '16:00',
      travelerName: 'Ada Lovelace',
      availableWeightLabel: '18 kg',
      pricePerKiloLabel: '15€ / kg',
      shareUrl: 'http://localhost:4200/search?from=Paris&to=Abidjan',
      shareUrlLabel: 'localhost:4200/search',
      tripReference: '#T000C',
    });
    shareCardMapperServiceMock.buildFileDate.and.returnValue('2025-07-14');
    shareCardExportServiceMock.generateQrCodeDataUrl.and.resolveTo('data:image/png;base64,qr');
    shareCardExportServiceMock.captureElementAsPngFile.and.resolveTo(
      new File(['png'], 'coliclic-annonce-2025-07-14.png', { type: 'image/png' })
    );

    await TestBed.configureTestingModule({
      imports: [ReservationDetailsPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: tripParamMap$.asObservable(),
          },
        },
        { provide: TripService, useValue: tripServiceMock },
        { provide: MessagingService, useValue: messagingServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ShareCardMapperService, useValue: shareCardMapperServiceMock },
        { provide: ShareCardExportService, useValue: shareCardExportServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(ReservationDetailsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('shows a loading state while reservation details are being fetched', () => {
    const tripSubject = new Subject<Trip>();
    const bookingsSubject = new Subject<BookingResponse[]>();
    tripServiceMock.getTripById.and.returnValue(tripSubject.asObservable());
    tripServiceMock.getTripBookings.and.returnValue(bookingsSubject.asObservable());

    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Chargement des demandes');
  });

  it('shows an error state when the reservation details request fails', () => {
    tripServiceMock.getTripById.and.returnValue(throwError(() => new Error('boom')));
    tripServiceMock.getTripBookings.and.returnValue(throwError(() => new Error('boom')));

    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Impossible de charger les détails de cette réservation.');
  });

  it('redirects to 404 when the reservation details request returns not found', () => {
    tripServiceMock.getTripBookings.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );

    createComponent();

    expect(router.navigate).toHaveBeenCalledWith(['/404']);
  });

  it('defaults to the pending tab when pending bookings are available', () => {
    createComponent();

    expect(component.selectedTab).toBe('PENDING');
    expect(component.filteredBookings().length).toBe(1);
  });

  it('filters bookings by status and paginates the current tab', () => {
    tripServiceMock.getTripBookings.and.returnValue(of([
      buildBooking({ id: 1, status: 'PENDING', title: 'A' }),
      buildBooking({ id: 2, status: 'PENDING', title: 'B' }),
      buildBooking({ id: 3, status: 'PENDING', title: 'C' }),
      buildBooking({ id: 4, status: 'PENDING', title: 'D' }),
      buildBooking({ id: 5, status: 'PENDING', title: 'E' }),
      buildBooking({ id: 6, status: 'ACCEPTED', title: 'F' }),
    ]));

    createComponent();

    expect(component.filteredBookings().length).toBe(5);
    expect(component.paginatedBookings().map((booking) => booking.id)).toEqual([1, 2, 3, 4]);

    component.goToPage(2);

    expect(component.paginatedBookings().map((booking) => booking.id)).toEqual([5]);

    component.selectTab('ACCEPTED');

    expect(component.currentPage).toBe(1);
    expect(component.paginatedBookings().map((booking) => booking.id)).toEqual([6]);
  });

  it('uses accepted bookings for loaded capacity and all active requests for potential revenue', () => {
    tripServiceMock.getTripBookings.and.returnValue(of([
      buildBooking({ id: 1, status: 'PENDING', weight: 3 }),
      buildBooking({ id: 2, status: 'ACCEPTED', weight: 4 }),
      buildBooking({ id: 3, status: 'REJECTED', weight: 6 }),
    ]));

    createComponent();

    expect(component.demandedWeight()).toBe(7);
    expect(component.usedWeight()).toBe(4);
    expect(component.remainingWeight()).toBe(16);
    expect(component.usedWeightPercentage()).toBe(20);
    expect(component.potentialAmount()).toBe(105);
  });

  it('renders the unified capacity card before reservations with live accepted weight and potential', () => {
    tripServiceMock.getTripById.and.returnValue(of({ ...buildTrip(), maxWeight: 50 }));
    tripServiceMock.getTripBookings.and.returnValue(of([
      buildBooking({ id: 1, status: 'PENDING', weight: 4 }),
      buildBooking({ id: 2, status: 'ACCEPTED', weight: 6 }),
      buildBooking({ id: 3, status: 'REJECTED', weight: 5 }),
    ]));
    createComponent();
    const card = fixture.nativeElement.querySelector('[data-testid="trip-capacity-card"]');
    const gauge = card.querySelector('[role="progressbar"]');
    expect(card.textContent).toContain('6 / 50 kg');
    expect(card.textContent).toContain('44 kg disponibles');
    expect(card.textContent).toContain('150 €');
    expect(gauge.getAttribute('aria-valuenow')).toBe('12');
    expect(card.compareDocumentPosition(fixture.nativeElement.querySelector('h2')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('bounds the load gauge and remaining weight for zero and exceeded capacity', () => {
    createComponent();

    component.trip = { ...buildTrip(), maxWeight: 0 };
    expect(component.usedWeightPercentage()).toBe(0);
    expect(component.displayedWeightPercentage()).toBe(0);
    expect(component.remainingWeight()).toBe(0);

    component.bookings = [buildBooking({ status: 'ACCEPTED', weight: 2 })];
    component.trip = { ...buildTrip(), maxWeight: 1 };
    expect(component.usedWeightPercentage()).toBe(100);
    expect(component.displayedWeightPercentage()).toBe(100);
    expect(component.remainingWeight()).toBe(0);
  });

  it('exposes editing, cancellation confirmation and image download directly', () => {
    createComponent();
    const edit = fixture.nativeElement.querySelector('[data-testid="edit-trip-link"]');
    expect(edit.getAttribute('href')).toBe('/propose/12');
    fixture.nativeElement.querySelector('[data-testid="delete-trip-button"]').click();
    fixture.detectChanges();
    expect(component.isCancelTripModalOpen).toBeTrue();
    expect(tripServiceMock.cancelTrip).not.toHaveBeenCalled();
    const download = spyOn(component, 'downloadTripAnnouncementImage');
    fixture.nativeElement.querySelector('[data-testid="download-trip-announcement-button"]').click();
    expect(download).toHaveBeenCalledTimes(1);
  });

  it('switches reservation tabs from the view and exposes the selected state', () => {
    tripServiceMock.getTripBookings.and.returnValue(of([
      buildBooking(), buildBooking({ id: 8, status: 'ACCEPTED', senderName: 'Ada Lovelace' }),
    ]));
    createComponent();
    const tabs = fixture.nativeElement.querySelectorAll('.reservation-tabs button');
    expect(tabs[0].textContent).toContain('En attente (1)');
    tabs[1].click();
    fixture.detectChanges();
    expect(tabs[1].getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelector('app-booking-request-card').textContent).toContain('Ada Lovelace');
  });

  it('disables the download button and shows progress while the image is generating', () => {
    createComponent();
    component.isGeneratingShareCard = true;
    fixture.detectChanges();

    const downloadButton = fixture.nativeElement.querySelector(
      '[data-testid="download-trip-announcement-button"]'
    ) as HTMLButtonElement;

    expect(downloadButton.disabled).toBeTrue();
    expect(downloadButton.textContent).toContain('Génération de l’affiche...');
  });

  it('anchors fixed mobile trip actions to the bottom of the viewport', () => {
    createComponent();

    const mobileActions = Array.from(
      fixture.nativeElement.querySelectorAll('div.fixed') as NodeListOf<HTMLElement>
    ).find((element) => element.classList.contains('md:hidden'));

    expect(mobileActions?.classList.contains('bottom-0')).toBeTrue();
    expect(mobileActions?.classList.contains('bottom-20')).toBeFalse();
  });

  it('renders city-only route labels on mobile and full route labels from small screens', () => {
    createComponent();

    const mobileRoute = fixture.nativeElement.querySelector(
      '[data-testid="mobile-trip-route"]'
    ) as HTMLElement | null;
    const desktopRoute = fixture.nativeElement.querySelector(
      '[data-testid="desktop-trip-route"]'
    ) as HTMLElement | null;

    expect(mobileRoute?.textContent?.trim()).toBe('Paris → Abidjan');
    expect(mobileRoute?.classList.contains('sm:hidden')).toBeTrue();
    expect(desktopRoute?.textContent?.trim()).toBe("Paris, France → Abidjan, Côte d'Ivoire");
    expect(desktopRoute?.classList.contains('sm:inline')).toBeTrue();
  });

  it('keeps locations without a country unchanged in the mobile route label', () => {
    createComponent();

    expect(component.cityName('Nantes')).toBe('Nantes');
    expect(component.cityName(' Abidjan ')).toBe('Abidjan');
  });

  for (const status of ['COMPLETED', 'CANCELLED'] as const) {
    it(`hides editing, deletion and image download for ${status.toLowerCase()} trips`, () => {
      tripServiceMock.getTripById.and.returnValue(of({ ...buildTrip(), status }));

      createComponent();

      expect(fixture.nativeElement.querySelector('[data-testid="edit-trip-link"]')).toBeNull();
      expect(fixture.nativeElement.querySelector('[data-testid="mobile-trip-actions-toggle"]')).toBeNull();
      expect(fixture.nativeElement.querySelector('[data-testid="download-trip-announcement-button"]')).toBeNull();
      expect(fixture.nativeElement.querySelector('[data-testid="mobile-trip-indicators"]')).not.toBeNull();

      expect(fixture.nativeElement.querySelector('a[aria-label="Modifier le trajet"]')).toBeNull();
      expect(fixture.nativeElement.querySelector('button[aria-label="Supprimer le trajet"]')).toBeNull();

      component.openCancelTripModal();
      expect(component.isCancelTripModalOpen).toBeFalse();
    });
  }

  it('generates and downloads the announcement PNG', async () => {
    createComponent();

    await component.downloadTripAnnouncementImage();

    expect(shareCardMapperServiceMock.mapActiveTripToShareCard).toHaveBeenCalledWith(
      component.trip,
      authServiceMock.getUser(),
      jasmine.objectContaining({ availableWeight: 20 })
    );
    expect(shareCardExportServiceMock.generateQrCodeDataUrl).toHaveBeenCalledWith(
      'http://localhost:4200/search?from=Paris&to=Abidjan'
    );
    expect(shareCardExportServiceMock.captureElementAsPngFile).toHaveBeenCalled();
    expect(shareCardExportServiceMock.downloadFile).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({ name: 'coliclic-annonce-2025-07-14.png', type: 'image/png' })
    );
    expect(component.isGeneratingShareCard).toBeFalse();
    expect(component.shareCardData).toBeNull();
  });

  it('opens the cancel trip modal from the mobile delete button', () => {
    createComponent();

    const deleteButton = fixture.nativeElement.querySelector(
      'button[aria-label="Supprimer le trajet"]'
    ) as HTMLButtonElement;

    deleteButton.click();

    expect(component.isCancelTripModalOpen).toBeTrue();
  });

  it('accepts a booking and updates it in the page state', () => {
    createComponent();

    component.acceptBooking(7);

    expect(tripServiceMock.acceptBooking).toHaveBeenCalledWith(12, 7);
    expect(component.bookings[0].status).toBe('ACCEPTED');
    expect(component.usedWeight()).toBe(2);
    expect(component.remainingWeight()).toBe(18);
  });

  it('rejects a booking and updates it in the page state', () => {
    createComponent();

    component.rejectBooking(7);

    expect(tripServiceMock.rejectBooking).toHaveBeenCalledWith(12, 7);
    expect(component.bookings[0].status).toBe('REJECTED');
    expect(component.usedWeight()).toBe(0);
    expect(component.potentialAmount()).toBe(0);
  });

  it('opens the existing confirmation from the list cancellation menu before removing a booking', () => {
    tripServiceMock.getTripBookings.and.returnValue(of([buildBooking({ status: 'ACCEPTED' })]));
    createComponent();
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('app-booking-request-card');
    expect(row.textContent).toContain(buildTrip().destination);
    row.querySelector('button[aria-expanded]').click();
    fixture.detectChanges();
    row.querySelector('[id="booking-options-7"] button').click();
    fixture.detectChanges();
    expect(component.isRemoveBookingModalOpen).toBeTrue();
    expect(component.pendingRemoveBookingId).toBe(7);
    expect(tripServiceMock.removeBooking).not.toHaveBeenCalled();
    component.confirmRemoveBooking();
    fixture.detectChanges();
    expect(tripServiceMock.removeBooking).toHaveBeenCalledWith(12, 7);
    expect(fixture.nativeElement.querySelector('app-booking-request-card')).toBeNull();
  });

  it('accepts a pending request from its footer and displays it as an accepted list row', () => {
    createComponent();
    fixture.detectChanges();
    const footer = fixture.nativeElement.querySelector('app-booking-request-card footer');
    expect(footer).not.toBeNull();
    const buttons = Array.from(footer.querySelectorAll('button')) as HTMLButtonElement[];
    buttons.find(button => button.textContent?.trim() === 'Accepter')!.click();
    fixture.detectChanges();
    expect(tripServiceMock.acceptBooking).toHaveBeenCalledWith(12, 7);
    expect(component.bookings[0].status).toBe('ACCEPTED');
    component.selectTab('ACCEPTED');
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('app-booking-request-card');
    expect(row).not.toBeNull();
    expect(row.querySelector('footer')).toBeNull();
    expect(row.querySelector('button[aria-expanded]')).not.toBeNull();
  });

  it('removes a booking after confirmation', () => {
    createComponent();

    component.openRemoveBookingModal(7);
    component.confirmRemoveBooking();

    expect(tripServiceMock.removeBooking).toHaveBeenCalledWith(12, 7);
    expect(component.bookings).toEqual([]);
    expect(component.isRemoveBookingModalOpen).toBeFalse();
  });

  it('starts a conversation with the sender and navigates to messages', () => {
    createComponent();

    component.messageSender(7);

    expect(messagingServiceMock.createConversationDraft).toHaveBeenCalledWith({
      tripId: 12,
      recipientId: 55,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/messages'], { queryParams: { conversationId: 1 } });
  });

  it('navigates to the trip completion page when finishing the trip', () => {
    createComponent();

    component.markTripCompleted();
    expect(component.isCompleteTripModalOpen).toBeTrue();

    component.confirmCompleteTrip();

    expect(tripServiceMock.completeTrip).toHaveBeenCalledWith(12);
    expect(router.navigate).toHaveBeenCalledWith(['/trips', 12, 'reservations', 'complete']);
    expect(component.isCompleteTripModalOpen).toBeFalse();
    expect(component.isCompletingTrip).toBeFalse();
  });

  it('displays an error and keeps modal open when completeTrip API fails', () => {
    createComponent();
    tripServiceMock.completeTrip.and.returnValue(throwError(() => ({ error: { message: 'Trajet déjà terminé' } })));

    component.markTripCompleted();
    component.confirmCompleteTrip();

    expect(tripServiceMock.completeTrip).toHaveBeenCalledWith(12);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.isCompleteTripModalOpen).toBeTrue();
    expect(component.completeTripError).toBe('Trajet déjà terminé');
    expect(component.isCompletingTrip).toBeFalse();
  });

  it('closes the complete trip modal when cancelled', () => {
    createComponent();

    component.markTripCompleted();
    expect(component.isCompleteTripModalOpen).toBeTrue();

    component.completeTripError = 'Some error';
    component.closeCompleteTripModal();
    expect(component.isCompleteTripModalOpen).toBeFalse();
    expect(component.completeTripError).toBe('');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('cancels the trip and returns to its reservations page', () => {
    createComponent();

    component.openCancelTripModal();
    component.confirmCancelTrip();

    expect(tripServiceMock.cancelTrip).toHaveBeenCalledWith(12);
    expect(component.trip?.status).toBe('CANCELLED');
    expect(router.navigate).toHaveBeenCalledWith(['/trips', 12, 'reservations']);
  });

  it('confirms a booking delivery with the provided validation code', () => {
    createComponent();

    component.confirmBookingDelivery({ bookingId: 7, code: '123456' });

    expect(tripServiceMock.confirmBookingDelivery).toHaveBeenCalledWith(12, 7, {
      validationCode: '123456',
    });
    expect(component.bookings[0].deliveredAt).toBe('2025-07-15T10:00:00');
  });

  it('renders the compact trip information card with navigation and edit affordances', () => {
    createComponent();

    const backLink = fixture.nativeElement.querySelector(
      '[data-testid="back-to-trips"]'
    ) as HTMLAnchorElement | null;
    const reference = fixture.nativeElement.querySelector(
      '[data-testid="trip-reference"]'
    ) as HTMLElement | null;
    const tripCard = fixture.nativeElement.querySelector(
      '[data-testid="trip-information-card"]'
    ) as HTMLElement | null;
    const route = fixture.nativeElement.querySelector(
      '[data-testid="mobile-trip-route"]'
    ) as HTMLElement | null;
    const metadata = fixture.nativeElement.querySelector(
      '[data-testid="trip-information-metadata"]'
    ) as HTMLElement | null;
    const country = fixture.nativeElement.querySelector(
      '[data-testid="trip-information-country"]'
    ) as HTMLElement | null;
    const separator = fixture.nativeElement.querySelector(
      '[data-testid="trip-information-separator"]'
    ) as HTMLElement | null;
    const departure = fixture.nativeElement.querySelector(
      '[data-testid="trip-information-departure"]'
    ) as HTMLElement | null;
    const editLink = fixture.nativeElement.querySelector(
      '[data-testid="edit-trip-link"]'
    ) as HTMLAnchorElement | null;

    expect(backLink?.textContent?.trim()).toContain('Tous mes trajets');
    expect(backLink?.getAttribute('href')).toBe('/trips');
    expect(reference?.textContent?.trim()).toBe('TRP-2026-000012');
    expect(tripCard).not.toBeNull();
    expect(route?.textContent?.trim()).toBe('Paris → Abidjan');
    expect(metadata?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Côte d\'Ivoire • Départ le 14/07 • 08:00');
    expect(country?.classList.contains('block')).toBeTrue();
    expect(country?.classList.contains('sm:inline')).toBeTrue();
    expect(separator?.classList.contains('hidden')).toBeTrue();
    expect(separator?.classList.contains('sm:inline')).toBeFalse();
    expect(departure?.classList.contains('block')).toBeTrue();
    expect(departure?.classList.contains('sm:inline')).toBeTrue();
    expect(editLink?.getAttribute('href')).toContain('/propose/12');
    expect(editLink?.classList.contains('hidden')).toBeFalse();
    expect(fixture.nativeElement.querySelector('[data-testid="delete-trip-button"]')).not.toBeNull();
  });
});

function buildTrip(): Trip {
  return {
    id: 12,
    reference: 'TRP-2026-000012',
    travelerId: 1,
    travelerName: 'Ada Lovelace',
    departureAddress: 'Paris, France',
    destination: "Abidjan, Côte d'Ivoire",
    departureTime: '2025-07-14T08:00:00',
    arrivalTime: '2025-07-14T16:00:00',
    maxWeight: 20,
    pricePerKilo: 15,
    instantAcceptance: true,
    status: 'ACTIVE',
    availableWeight: 8,
  };
}

function buildBooking(overrides: Partial<BookingResponse> = {}): BookingResponse {
  return {
    id: 7,
    tripId: 12,
    senderId: 55,
    senderName: 'Grace Hopper',
    title: 'Documents',
    weight: 2,
    description: 'Dossier important',
    recipientContact: '+22501020304',
    status: 'PENDING',
    validationCodeActive: false,
    ...overrides,
  };
}
