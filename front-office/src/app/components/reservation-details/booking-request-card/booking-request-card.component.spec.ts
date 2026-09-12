import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BookingResponse } from '../../../models/booking.model';
import { BookingRequestCardComponent } from './booking-request-card.component';

describe('BookingRequestCardComponent', () => {
  let fixture: ComponentFixture<BookingRequestCardComponent>;
  let component: BookingRequestCardComponent;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingRequestCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(BookingRequestCardComponent);
    component = fixture.componentInstance;
    component.tripId = 12;
    component.tripStatus = 'ACTIVE';
    component.pricePerKilo = 15;
    component.booking = buildBooking();
    fixture.detectChanges();
  });

  it('emits the booking id when accepting a pending request', () => {
    spyOn(component.accept, 'emit');

    component.onAccept();

    expect(component.accept.emit).toHaveBeenCalledWith(7);
  });

  it('emits the booking id when rejecting a pending request', () => {
    spyOn(component.reject, 'emit');

    component.onReject();

    expect(component.reject.emit).toHaveBeenCalledWith(7);
  });

  it('emits the booking id when removing an accepted request', () => {
    component.booking = { ...buildBooking(), status: 'ACCEPTED' };
    spyOn(component.remove, 'emit');

    component.onRemove();

    expect(component.remove.emit).toHaveBeenCalledWith(7);
  });

  it('emits the booking id when messaging the sender', () => {
    spyOn(component.message, 'emit');

    component.onMessage();

    expect(component.message.emit).toHaveBeenCalledWith(7);
  });

  it('emits the delivery confirmation payload with a valid six-digit code', () => {
    component.booking = {
      ...buildBooking(),
      status: 'ACCEPTED',
      validationCodeActive: true,
    };
    component.tripStatus = 'COMPLETED';
    component.deliveryCode = '123456';
    spyOn(component.confirmDelivery, 'emit');

    component.onConfirmDelivery();

    expect(component.confirmDelivery.emit).toHaveBeenCalledWith({
      bookingId: 7,
      code: '123456',
    });
  });

  it('does not emit the delivery confirmation payload with an invalid code', () => {
    component.booking = {
      ...buildBooking(),
      status: 'ACCEPTED',
      validationCodeActive: true,
    };
    component.tripStatus = 'COMPLETED';
    component.deliveryCode = '12345';
    spyOn(component.confirmDelivery, 'emit');

    component.onConfirmDelivery();

    expect(component.confirmDelivery.emit).not.toHaveBeenCalled();
  });

  it('returns the sender initial for the avatar badge', () => {
    expect(component.senderInitial()).toBe('G');
  });

  it('renders the sender profile photo when available', () => {
    component.booking = {
      ...buildBooking(),
      senderPhotoUrl: '/api/uploads/grace.png',
    };

    fixture.detectChanges();

    const profileImage = fixture.nativeElement.querySelector('img[alt="Photo de profil de Grace Hopper"]');
    expect(profileImage?.getAttribute('src')).toBe('/api/uploads/grace.png');
  });

  it('falls back to initials when the sender profile photo fails to load', () => {
    component.booking = {
      ...buildBooking(),
      senderPhotoUrl: '/api/uploads/broken-grace.png',
    };

    fixture.detectChanges();
    fixture.componentInstance.onSenderPhotoError();
    fixture.detectChanges();

    const profileImage = fixture.nativeElement.querySelector('img[alt="Photo de profil de Grace Hopper"]');
    expect(profileImage).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('G');
  });

  it('does not render an invalidated-code information block', () => {
    component.booking = {
      ...buildBooking(),
      status: 'ACCEPTED',
      validationCodeInvalidatedAt: '2026-05-22T15:08:00',
    };

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Code invalidé');
    expect(fixture.nativeElement.textContent).not.toContain('Invalidé le');
  });

  it('renders the reservation amount when the trip price per kilo is available', () => {
    component.booking = {
      ...buildBooking(),
      weight: 4,
    };
    component.pricePerKilo = 15;

    fixture.detectChanges();

    expect(component.reservationAmount()).toBe(60);
    expect(fixture.nativeElement.textContent).toContain('60 €');
  });

  it('navigates to the dedicated reservation detail page when clicking details', () => {
    component.goToDetails();

    expect(router.navigate).toHaveBeenCalledWith(['/trips', 12, 'reservations', 7]);
  });

  it('statusBadgeClass() returns neutral style for pending status', () => {
    expect(component.statusBadgeClass('PENDING')).toContain('text-text-secondary');
  });

  it('statusBadgeClass() returns green/secondary style for accepted status', () => {
    expect(component.statusBadgeClass('ACCEPTED')).toContain('text-secondary');
  });

  it('statusBadgeClass() returns red style for rejected status', () => {
    expect(component.statusBadgeClass('REJECTED')).toContain('text-error');
  });
});

function buildBooking(): BookingResponse {
  return {
    id: 7,
    tripId: 12,
    senderId: 99,
    senderName: 'Grace Hopper',
    senderPhotoUrl: undefined,
    title: 'Valise cabine',
    weight: 4,
    description: 'Objets personnels',
    packagePhotoUrl: 'https://example.com/package.png',
    recipientContact: '+22501020304',
    status: 'PENDING',
    validationCodeActive: false,
  };
}
