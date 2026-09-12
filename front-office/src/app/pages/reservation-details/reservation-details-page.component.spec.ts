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
    shareOrDownloadPng: jasmine.createSpy('shareOrDownloadPng'),
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
    shareCardExportServiceMock.shareOrDownloadPng.calls.reset();

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
    shareCardExportServiceMock.shareOrDownloadPng.and.resolveTo('downloaded');

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

  it('computes the demanded and remaining weight from active bookings', () => {
    tripServiceMock.getTripBookings.and.returnValue(of([
      buildBooking({ id: 1, status: 'PENDING', weight: 3 }),
      buildBooking({ id: 2, status: 'ACCEPTED', weight: 4 }),
      buildBooking({ id: 3, status: 'REJECTED', weight: 6 }),
    ]));

    createComponent();

    expect(component.demandedWeight()).toBe(7);
    expect(component.remainingWeight()).toBe(13);
    expect(component.usedWeightPercentage()).toBe(35);
  });

  it('renders mobile trip actions in the summary card', () => {
    createComponent();

    component.toggleTripSummary();
    fixture.detectChanges();

    const editLink = fixture.nativeElement.querySelector(
      'a[aria-label="Modifier le trajet"]'
    ) as HTMLAnchorElement | null;
    const deleteButton = fixture.nativeElement.querySelector(
      'button[aria-label="Supprimer le trajet"]'
    ) as HTMLButtonElement | null;
    const shareButton = fixture.nativeElement.querySelector(
      '[data-testid="share-trip-announcement-button"]'
    ) as HTMLButtonElement | null;

    expect(editLink).not.toBeNull();
    expect(editLink?.getAttribute('href')).toContain('/propose/12');
    expect(deleteButton).not.toBeNull();
    expect(shareButton).not.toBeNull();
    expect(shareButton?.textContent).toContain("Partager l'annonce");
  });

  it('does not render the share announcement button for inactive trips', () => {
    tripServiceMock.getTripById.and.returnValue(of({ ...buildTrip(), status: 'COMPLETED' }));

    createComponent();

    component.toggleTripSummary();
    fixture.detectChanges();

    const shareButton = fixture.nativeElement.querySelector(
      '[data-testid="share-trip-announcement-button"]'
    ) as HTMLButtonElement | null;

    expect(shareButton).toBeNull();
  });

  it('generates the share card and uses the native share fallback service', async () => {
    createComponent();

    await component.shareTripAnnouncement();

    expect(shareCardMapperServiceMock.mapActiveTripToShareCard).toHaveBeenCalledWith(
      component.trip,
      authServiceMock.getUser(),
      jasmine.objectContaining({ availableWeight: 18 })
    );
    expect(shareCardExportServiceMock.generateQrCodeDataUrl).toHaveBeenCalledWith(
      'http://localhost:4200/search?from=Paris&to=Abidjan'
    );
    expect(shareCardExportServiceMock.captureElementAsPngFile).toHaveBeenCalled();
    expect(shareCardExportServiceMock.shareOrDownloadPng).toHaveBeenCalledWith(
      jasmine.any(File),
      jasmine.objectContaining({ title: 'Trajet disponible sur Coliclic' })
    );
    expect(component.isGeneratingShareCard).toBeFalse();
    expect(component.shareCardData).toBeNull();
  });

  it('opens the cancel trip modal from the mobile delete button', () => {
    createComponent();

    component.toggleTripSummary();
    fixture.detectChanges();

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
  });

  it('rejects a booking and updates it in the page state', () => {
    createComponent();

    component.rejectBooking(7);

    expect(tripServiceMock.rejectBooking).toHaveBeenCalledWith(12, 7);
    expect(component.bookings[0].status).toBe('REJECTED');
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

  it('cancels the trip and navigates back to the dashboard received tab', () => {
    createComponent();

    component.openCancelTripModal();
    component.confirmCancelTrip();

    expect(tripServiceMock.cancelTrip).toHaveBeenCalledWith(12);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard'], {
      queryParams: { tab: 'received' },
    });
  });

  it('confirms a booking delivery with the provided validation code', () => {
    createComponent();

    component.confirmBookingDelivery({ bookingId: 7, code: '123456' });

    expect(tripServiceMock.confirmBookingDelivery).toHaveBeenCalledWith(12, 7, {
      validationCode: '123456',
    });
    expect(component.bookings[0].deliveredAt).toBe('2025-07-15T10:00:00');
  });

  it('displays the trip business reference in the trip summary', () => {
    createComponent();

    expect(fixture.nativeElement.textContent).toContain('TRP-2026-000012');
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
