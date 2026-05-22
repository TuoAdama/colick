import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookingResponse } from '../../../models/booking.model';
import { BookingRequestCardComponent } from './booking-request-card.component';

describe('BookingRequestCardComponent', () => {
  let fixture: ComponentFixture<BookingRequestCardComponent>;
  let component: BookingRequestCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingRequestCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingRequestCardComponent);
    component = fixture.componentInstance;
    component.tripId = 12;
    component.tripStatus = 'ACTIVE';
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
});

function buildBooking(): BookingResponse {
  return {
    id: 7,
    tripId: 12,
    senderId: 99,
    senderName: 'Grace Hopper',
    title: 'Valise cabine',
    weight: 4,
    description: 'Objets personnels',
    packagePhotoUrl: 'https://example.com/package.png',
    recipientContact: '+22501020304',
    status: 'PENDING',
    validationCodeActive: false,
  };
}
