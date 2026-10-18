import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { BookingResponse } from '../../models/booking.model';
import { Trip } from '../../models/trip.model';
import { MessagingService } from '../../services/messaging.service';
import { TripService } from '../../services/trip.service';
import { SentBookingDetailPageComponent } from './sent-booking-detail-page.component';

describe('SentBookingDetailPageComponent', () => {
  let fixture: ComponentFixture<SentBookingDetailPageComponent>;
  let component: SentBookingDetailPageComponent;
  let router: Router;

  const paramMap$ = new BehaviorSubject(convertToParamMap({ tripId: '12', bookingId: '7' }));

  const tripServiceMock = {
    getTripById: jasmine.createSpy('getTripById'),
    getMyTripBookingById: jasmine.createSpy('getMyTripBookingById'),
    cancelBooking: jasmine.createSpy('cancelBooking'),
    uploadBookingPhoto: jasmine.createSpy('uploadBookingPhoto'),
  };

  const messagingServiceMock = {
    createConversationDraft: jasmine.createSpy('createConversationDraft'),
  };

  beforeEach(async () => {
    paramMap$.next(convertToParamMap({ tripId: '12', bookingId: '7' }));
    tripServiceMock.getTripById.calls.reset();
    tripServiceMock.getMyTripBookingById.calls.reset();
    tripServiceMock.cancelBooking.calls.reset();
    tripServiceMock.uploadBookingPhoto.calls.reset();
    messagingServiceMock.createConversationDraft.calls.reset();

    tripServiceMock.getTripById.and.returnValue(of(buildTrip()));
    tripServiceMock.getMyTripBookingById.and.returnValue(of(buildBooking()));
    tripServiceMock.cancelBooking.and.returnValue(of({ ...buildBooking(), status: 'CANCELLED' }));
    tripServiceMock.uploadBookingPhoto.and.returnValue(of(buildBooking({ packagePhotoUrl: '/photo.png' })));
    messagingServiceMock.createConversationDraft.and.returnValue(of({
      id: 3,
      tripId: 12,
      tripRoute: 'Paris → Abidjan',
      otherParticipantId: 1,
      otherParticipantName: 'Ada Lovelace',
      lastMessage: null,
      unreadCount: 0,
      createdAt: '2025-07-15T09:00:00',
    }));

    await TestBed.configureTestingModule({
      imports: [SentBookingDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable(),
          },
        },
        { provide: TripService, useValue: tripServiceMock },
        { provide: MessagingService, useValue: messagingServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(SentBookingDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads the trip and sent booking detail', () => {
    createComponent();

    expect(tripServiceMock.getTripById).toHaveBeenCalledWith(12);
    expect(tripServiceMock.getMyTripBookingById).toHaveBeenCalledWith(12, 7);
    expect(fixture.nativeElement.textContent).toContain('Documents');
    expect(fixture.nativeElement.textContent).toContain('Paris, France');
    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');
    expect(fixture.nativeElement.textContent).toContain('alice@example.com');
  });

  it('redirects to 404 when the booking cannot be found', () => {
    tripServiceMock.getMyTripBookingById.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );

    createComponent();

    expect(component.booking).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/404']);
  });

  it('starts a draft conversation with the traveler', () => {
    createComponent();

    component.messageTraveler();

    expect(messagingServiceMock.createConversationDraft).toHaveBeenCalledWith({
      tripId: 12,
      recipientId: 1,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/messages'], { queryParams: { conversationId: 3 } });
  });

  it('cancels a cancellable sent booking', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    createComponent();

    component.cancelBooking();

    expect(tripServiceMock.cancelBooking).toHaveBeenCalledWith(12, 7);
    expect(component.booking?.status).toBe('CANCELLED');
  });

  it('does not show cancel action for rejected bookings', () => {
    tripServiceMock.getMyTripBookingById.and.returnValue(of(buildBooking({ status: 'REJECTED' })));

    createComponent();

    expect(component.canCancelBooking()).toBeFalse();
    expect(fixture.nativeElement.textContent).not.toContain('Annuler la demande');
  });

  it('renders three sections, a reference and a single message action', () => {
    createComponent();
    const root = fixture.nativeElement as HTMLElement;
    expect(Array.from(root.querySelectorAll('section h2')).map(el => el.textContent)).toEqual(['Trajet', 'Votre colis', 'Voyageur et tarif']);
    expect(root.querySelector('.detail-reference')!.textContent).toContain('Référence trajet : TRP-2026-000013');
    expect(root.textContent).not.toContain('TRK-');
    expect(root.textContent).toContain('4,8 · 24 avis');
    expect(root.querySelector('.price-total')!.textContent).toContain('30 €');
    expect(root.querySelectorAll('.message-button').length).toBe(1);
    expect(root.querySelector('a[href="/sent-bookings"]')).not.toBeNull();
  });

  it('does not fabricate a reference or leave a separator when the trip has no reference', () => {
    tripServiceMock.getTripById.and.returnValue(of({ ...buildTrip(), reference: undefined }));
    createComponent();
    const metadata = fixture.nativeElement.querySelector('.detail-reference').textContent.trim();
    expect(metadata).toContain('2025');
    expect(metadata).not.toContain('Référence trajet');
    expect(metadata).not.toContain('TRK-');
    expect(metadata).not.toContain('·');
  });

  it('shows the persisted reference without an empty date separator', () => {
    tripServiceMock.getMyTripBookingById.and.returnValue(of(buildBooking({ createdAt: undefined })));
    createComponent();
    const metadata = fixture.nativeElement.querySelector('.detail-reference').textContent.trim();
    expect(metadata).toBe('Référence trajet : TRP-2026-000013');
  });

  it('renders safe fallbacks when optional information is missing', () => {
    tripServiceMock.getTripById.and.returnValue(of({ ...buildTrip(), departureAddress: 'Paris', departureTime: '', arrivalTime: 'invalid', travelerRatingAverage: null, travelerRatingCount: 0 }));
    tripServiceMock.getMyTripBookingById.and.returnValue(of(buildBooking({ description: undefined, createdAt: undefined })));
    createComponent();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Aucune description fournie.');
    expect(text).toContain('Aucun avis pour le moment');
    expect(text).toContain('Non renseigné');
    expect(text).not.toContain('Invalid Date');
    expect(text).not.toContain('undefined');
    expect(component.routeCountry('Paris')).toBe('');
    expect(component.routeCountry('Paris, Île-de-France, France')).toBe('France');
  });

  for (const booking of [
    buildBooking({ commercialMode: 'FREE', platformFeeRate: 0 }),
    buildBooking(),
  ]) {
    it('shows direct settlement for a free or legacy booking without fees', () => {
      tripServiceMock.getMyTripBookingById.and.returnValue(of(booking));
      createComponent();
      expect(fixture.nativeElement.textContent).toContain('Règlement à convenir avec le voyageur.');
    });
  }

  for (const overrides of [
    { commercialMode: 'COMMISSION' as const, platformFeeRate: 0 },
    { platformFeeRate: 0.1 },
  ]) {
    it('does not promise direct settlement for commission or fee-bearing bookings', () => {
      tripServiceMock.getMyTripBookingById.and.returnValue(of(buildBooking(overrides)));
      createComponent();
      expect(fixture.nativeElement.textContent).not.toContain('Règlement à convenir');
      expect(fixture.nativeElement.querySelector('.price-total').textContent).toContain('30 €');
    });
  }

  it('does not cancel when confirmation is declined', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    createComponent();
    (fixture.nativeElement.querySelector('.cancel-button') as HTMLButtonElement).click();
    expect(tripServiceMock.cancelBooking).not.toHaveBeenCalled();
  });

  it('disables actions while messaging and reports a recoverable error', () => {
    const pending = new Subject<never>();
    messagingServiceMock.createConversationDraft.and.returnValue(pending);
    createComponent();
    (fixture.nativeElement.querySelector('.message-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.message-button').disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('.cancel-button').disabled).toBeTrue();
    component.messageTraveler();
    expect(messagingServiceMock.createConversationDraft).toHaveBeenCalledTimes(1);
    pending.error(new Error('offline'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Impossible de démarrer');
    expect(fixture.nativeElement.querySelector('.message-button').disabled).toBeFalse();
  });

  it('shows a cancellation error without changing the booking status', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    tripServiceMock.cancelBooking.and.returnValue(throwError(() => new Error('offline')));
    createComponent();
    component.cancelBooking();
    fixture.detectChanges();
    expect(component.booking?.status).toBe('PENDING');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain("Impossible d'annuler");
  });

  it('renders the loading and non-404 error states', () => {
    const pending = new Subject<BookingResponse>();
    tripServiceMock.getMyTripBookingById.and.returnValue(pending);
    createComponent();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Chargement');
    pending.error(new HttpErrorResponse({ status: 500 }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain("Impossible d'afficher");
  });

  it('rejects invalid route parameters without requesting a detail', () => {
    paramMap$.next(convertToParamMap({ tripId: 'bad', bookingId: '-1' }));
    createComponent();
    expect(tripServiceMock.getTripById).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('shows an existing photo inside the parcel section without an upload action', () => {
    tripServiceMock.getMyTripBookingById.and.returnValue(of(buildBooking({ packagePhotoUrl: '/photo.png' })));
    createComponent();
    const parcel = fixture.nativeElement.querySelector('[aria-labelledby="parcel-heading"]');
    expect(parcel.querySelector('img').getAttribute('src')).toBe('/photo.png');
    expect(parcel.textContent).not.toContain('Ajouter une photo');
  });

  for (const status of ['REJECTED', 'CANCELLED', 'REMOVED'] as const) {
    it(`hides cancellation and photo upload for ${status}`, () => {
      tripServiceMock.getMyTripBookingById.and.returnValue(of(buildBooking({ status })));
      createComponent();
      expect(fixture.nativeElement.querySelector('.cancel-button')).toBeNull();
      expect(fixture.nativeElement.querySelector('input[type="file"]')).toBeNull();
    });
  }

  function selectPhoto(file: File): void {
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    it(`uploads a valid ${type} photo and displays it`, () => {
      createComponent();
      const file = new File(['image'], 'parcel', { type });
      selectPhoto(file);
      expect(tripServiceMock.uploadBookingPhoto).toHaveBeenCalledWith(12, 7, file);
      expect(fixture.nativeElement.querySelector('.parcel-photo')).not.toBeNull();
      expect(fixture.nativeElement.textContent).toContain('La photo du colis a bien été ajoutée.');
    });
  }

  it('rejects an unsupported photo type and an oversized photo before upload', () => {
    createComponent();
    selectPhoto(new File(['x'], 'parcel.svg', { type: 'image/svg+xml' }));
    expect(tripServiceMock.uploadBookingPhoto).not.toHaveBeenCalled();
    selectPhoto(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'parcel.png', { type: 'image/png' }));
    expect(tripServiceMock.uploadBookingPhoto).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('5 Mo maximum');
  });

  it('allows retrying a failed photo upload and disables actions during upload', () => {
    const pending = new Subject<BookingResponse>();
    tripServiceMock.uploadBookingPhoto.and.returnValue(pending);
    createComponent();
    selectPhoto(new File(['image'], 'parcel.png', { type: 'image/png' }));
    expect(fixture.nativeElement.querySelector('.message-button').disabled).toBeTrue();
    pending.error(new Error('offline'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Impossible d’envoyer la photo');
    tripServiceMock.uploadBookingPhoto.and.returnValue(of(buildBooking({ packagePhotoUrl: '/retry.png' })));
    selectPhoto(new File(['image'], 'parcel.png', { type: 'image/png' }));
    expect(tripServiceMock.uploadBookingPhoto).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('.parcel-photo').getAttribute('src')).toBe('/retry.png');
  });

  it('offers calling only for a telephone recipient', () => {
    createComponent();
    expect(fixture.nativeElement.querySelector('a[href^="tel:"]')).toBeNull();
    component.booking = buildBooking({ recipientContact: '+33 6 00 00 00 00' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href^="tel:"]').getAttribute('href')).toBe('tel:+33600000000');
  });

  it('copies the actual recipient and reports success or failure accessibly', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const writeText = jasmine.createSpy('writeText').and.resolveTo();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    try {
      createComponent();
      await component.copyRecipientContact();
      fixture.detectChanges();
      expect(writeText).toHaveBeenCalledWith('alice@example.com');
      expect(fixture.nativeElement.querySelector('.contact-feedback').textContent).toContain('Contact copié.');
      writeText.and.rejectWith(new Error('denied'));
      await component.copyRecipientContact();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.contact-feedback').textContent).toContain('Impossible de copier');
      expect(component.isCopyingContact).toBeFalse();
    } finally {
      if (descriptor) Object.defineProperty(navigator, 'clipboard', descriptor);
      else Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

});

function buildTrip(): Trip {
  return {
    id: 12,
    reference: 'TRP-2026-000013',
    travelerId: 1,
    travelerName: 'Ada Lovelace',
    travelerRatingAverage: 4.8,
    travelerRatingCount: 24,
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
    recipientContact: 'alice@example.com',
    status: 'PENDING',
    validationCodeActive: false,
    createdAt: '2025-07-10T09:30:00Z',
    ...overrides,
  };
}
