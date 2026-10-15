import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { BookingRequestFormComponent } from './booking-request-form.component';
import { TripService } from '../../../services/trip.service';

describe('BookingRequestFormComponent', () => {
  let fixture: ComponentFixture<BookingRequestFormComponent>;
  let component: BookingRequestFormComponent;

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
    tripServiceMock.createBooking.and.returnValue(of({
      id: 1,
      tripId: 10,
      senderId: 2,
      senderName: 'Bob Martin',
      title: 'Documents',
      weight: 1,
      recipientContact: 'recipient@example.com',
      status: 'PENDING',
      validationCodeActive: false,
    }));
    tripServiceMock.uploadBookingPhoto.calls.reset();
    tripServiceMock.uploadBookingPhoto.and.stub();
    await TestBed.configureTestingModule({
      imports: [BookingRequestFormComponent],
      providers: [provideRouter([]), { provide: TripService, useValue: tripServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingRequestFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('trip', {
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
    });
    fixture.componentRef.setInput('initialWeight', 2.5);
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

  it('keeps recipient contact required and explains when it is used', () => {
    expect(component.bookingForm.controls.recipientContact.hasError('required')).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Le voyageur reçoit ce contact avec votre demande. Le code de remise sera envoyé après acceptation.',
    );
  });

  it('uses the weight selected on the trip page', () => {
    expect(component.bookingForm.controls.weight.value).toBe(2.5);
  });

  it('returns from the safety step to the information step using the footer action', () => {
    component.currentStep = 2;
    fixture.detectChanges();

    const backButton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find(button => button.textContent?.trim() === 'Retour aux informations');
    backButton?.click();
    fixture.detectChanges();

    expect(component.currentStep as number).toBe(1);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Étape 1 sur 2');
  });

  it('scrolls to the request card after valid details advance to step 2', async () => {
    const scrollCardIntoView = spyOn(
      (fixture.nativeElement as HTMLElement).querySelector('section[aria-labelledby="booking-page-title"]') as HTMLElement,
      'scrollIntoView',
    );
    component.bookingForm.patchValue({ title: 'Documents', weight: 1, recipientContact: 'recipient@example.com' });

    const continueButton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find(button => button.textContent?.trim() === 'Continuer');
    continueButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.currentStep).toBe(2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Étape 2 sur 2');
    expect(scrollCardIntoView).toHaveBeenCalledOnceWith({ behavior: 'smooth', block: 'start' });
  });

  it('stays on step 1 and does not scroll when required details are invalid', async () => {
    const scrollCardIntoView = spyOn(
      (fixture.nativeElement as HTMLElement).querySelector('section[aria-labelledby="booking-page-title"]') as HTMLElement,
      'scrollIntoView',
    );

    const continueButton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find(button => button.textContent?.trim() === 'Continuer');
    continueButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.currentStep).toBe(1);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Étape 1 sur 2');
    expect(scrollCardIntoView).not.toHaveBeenCalled();
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

  it('scrolls to the request card after a successful submission without a photo', async () => {
    const scrollCardIntoView = spyOn(
      (fixture.nativeElement as HTMLElement).querySelector('section[aria-labelledby="booking-page-title"]') as HTMLElement,
      'scrollIntoView',
    );
    prepareValidSubmission();

    component.onSubmit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Demande envoyée avec succès !');
    expect(scrollCardIntoView).toHaveBeenCalledOnceWith({ behavior: 'smooth', block: 'start' });
  });

  it('scrolls to the request card after the photo upload succeeds', async () => {
    const scrollCardIntoView = spyOn(
      (fixture.nativeElement as HTMLElement).querySelector('section[aria-labelledby="booking-page-title"]') as HTMLElement,
      'scrollIntoView',
    );
    tripServiceMock.uploadBookingPhoto.and.returnValue(of({
      id: 1,
      tripId: 10,
      senderId: 2,
      senderName: 'Bob Martin',
      title: 'Documents',
      weight: 1,
      recipientContact: 'recipient@example.com',
      status: 'PENDING',
      validationCodeActive: false,
    }));
    prepareValidSubmission();
    component.selectedPhoto = new File(['image'], 'parcel.png', { type: 'image/png' });

    component.onSubmit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Demande envoyée avec succès !');
    expect(scrollCardIntoView).toHaveBeenCalledOnceWith({ behavior: 'smooth', block: 'start' });
  });

  it('does not scroll when booking creation or photo upload fails', () => {
    const scrollCardIntoView = spyOn(
      (fixture.nativeElement as HTMLElement).querySelector('section[aria-labelledby="booking-page-title"]') as HTMLElement,
      'scrollIntoView',
    );
    prepareValidSubmission();
    tripServiceMock.createBooking.and.returnValue(throwError(() => new Error('network failure')));

    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage).toContain('Erreur lors de l\'envoi');
    expect(scrollCardIntoView).not.toHaveBeenCalled();

    tripServiceMock.createBooking.and.returnValue(of({
      id: 1,
      tripId: 10,
      senderId: 2,
      senderName: 'Bob Martin',
      title: 'Documents',
      weight: 1,
      recipientContact: 'recipient@example.com',
      status: 'PENDING',
      validationCodeActive: false,
    }));
    tripServiceMock.uploadBookingPhoto.and.returnValue(throwError(() => new Error('upload failure')));
    component.selectedPhoto = new File(['image'], 'parcel.png', { type: 'image/png' });
    component.errorMessage = '';

    component.onSubmit();
    fixture.detectChanges();

    expect(component.photoUploadFailed).toBeTrue();
    expect(scrollCardIntoView).not.toHaveBeenCalled();
  });

  it('renders the request form as page content rather than a dialog', () => {
    const host = fixture.nativeElement as HTMLElement;
    const pageHeading = host.querySelector('#booking-page-title') as HTMLHeadingElement;

    expect(pageHeading.tagName).toBe('H1');
    expect(host.querySelector('[role="dialog"]')).toBeNull();
  });

  function prepareValidSubmission(): void {
    component.bookingForm.patchValue({
      title: 'Documents',
      weight: 1,
      recipientContact: 'recipient@example.com',
      parcelPolicyAccepted: true,
    });
  }
});
