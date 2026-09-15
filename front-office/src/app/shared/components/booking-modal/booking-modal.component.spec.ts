import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BookingModalComponent } from './booking-modal.component';
import { TripService } from '../../../services/trip.service';

describe('BookingModalComponent', () => {
  let fixture: ComponentFixture<BookingModalComponent>;
  let component: BookingModalComponent;

  const tripServiceMock = {
    createBooking: jasmine.createSpy('createBooking').and.returnValue(of({
      id: 1,
      tripId: 10,
      senderId: 2,
      senderName: 'Bob Martin',
      title: 'Documents',
      weight: 1,
      recipientContact: 'recipient@example.com',
      status: 'PENDING',
      validationCodeActive: false,
    })),
    uploadBookingPhoto: jasmine.createSpy('uploadBookingPhoto'),
    getParcelGuidelines: jasmine.createSpy('getParcelGuidelines').and.returnValue(of({
      version: '2026-09-01',
      prohibitedItems: ['Armes'],
      packagingRecommendations: ['Emballage rigide'],
      allowedPhotoContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxPhotoBytes: 5 * 1024 * 1024,
    })),
  };

  beforeEach(async () => {
    tripServiceMock.createBooking.calls.reset();
    tripServiceMock.uploadBookingPhoto.calls.reset();
    await TestBed.configureTestingModule({
      imports: [BookingModalComponent],
      providers: [{ provide: TripService, useValue: tripServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingModalComponent);
    component = fixture.componentInstance;
    component.trip = {
      id: 10,
      travelerId: 99,
      travelerName: 'Alice Dupont',
      departureAddress: 'Paris',
      destination: 'Abidjan',
      departureTime: '2026-05-01T08:00:00Z',
      arrivalTime: '2026-05-02T08:00:00Z',
      maxWeight: 10,
      availableWeight: 10,
      pricePerKilo: 5,
      instantAcceptance: false,
      status: 'ACTIVE',
    };
    component.isOpen = true;
    fixture.detectChanges();
  });

  it('marks recipient contact invalid when it is neither phone nor email', () => {
    component.bookingForm.patchValue({
      title: 'Documents',
      weight: 1,
      recipientContact: 'John Doe',
    });
    component.bookingForm.get('recipientContact')?.markAsTouched();

    expect(component.bookingForm.get('recipientContact')?.hasError('recipientContact')).toBeTrue();
  });

  it('trims recipient contact before sending the booking request', () => {
    component.bookingForm.patchValue({
      title: 'Documents',
      weight: 1,
      recipientContact: ' recipient@example.com ',
      parcelPolicyAccepted: true,
    });

    component.onSubmit();

    expect(tripServiceMock.createBooking).toHaveBeenCalledWith(10, jasmine.objectContaining({
      recipientContact: 'recipient@example.com',
      parcelPolicyAccepted: true,
      parcelPolicyVersion: '2026-09-01',
    }));
  });

  it('blocks submission until the parcel policy is accepted', () => {
    component.bookingForm.patchValue({ title: 'Documents', weight: 1, recipientContact: 'recipient@example.com' });
    component.onSubmit();
    expect(tripServiceMock.createBooking).not.toHaveBeenCalled();
  });

  it('focuses the parcel title field when opened', async () => {
    await fixture.whenStable();

    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#booking-title'));
  });
});
