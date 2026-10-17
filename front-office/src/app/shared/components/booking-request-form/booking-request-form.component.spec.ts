import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { BookingRequestFormComponent } from './booking-request-form.component';
import { BookingResponse } from '../../../models/booking.model';
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

  it('separates cities and countries from the trip location labels', () => {
    fixture.componentRef.setInput('trip', {
      ...component.trip!,
      departureAddress: ' Nantes, France ',
      destination: 'Abidjan, Côte d’Ivoire',
    });
    fixture.detectChanges();

    expect(component.departure).toEqual({ city: 'Nantes', country: 'France' });
    expect(component.destination).toEqual({ city: 'Abidjan', country: 'Côte d’Ivoire' });
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="booking-route"]')?.textContent).toContain('Nantes');
    expect(host.querySelector('[data-testid="booking-countries"]')?.textContent).toContain('Côte d’Ivoire');
    expect(host.querySelector('[data-testid="booking-capacity"]')?.textContent).toContain('10 kg disponibles · 5 €/kg');
    expect(host.querySelector('h1')?.textContent?.trim()).toBe('Votre colis');
  });

  it('omits the country line when the trip only supplies city names', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(component.departure).toEqual({ city: 'Paris', country: '' });
    expect(host.querySelector('[data-testid="booking-countries"]')).toBeNull();
    expect(host.querySelector('[data-testid="booking-route"]')?.textContent).toContain('Abidjan');
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
      'Le voyageur reçoit ce contact avec votre demande. Après acceptation, le code de remise est envoyé par e-mail à l’adresse de votre compte.',
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
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent?.trim()).toBe('Photo et sécurité');
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

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Demande envoyée');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Envoyé après acceptation.');
    expect(scrollCardIntoView).toHaveBeenCalledOnceWith({ behavior: 'smooth', block: 'start' });
    expect(document.activeElement).toBe((fixture.nativeElement as HTMLElement).querySelector('h1'));
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

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Demande envoyée');
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

  it('replaces the form with the pending timeline and real trip details', () => {
    prepareValidSubmission();
    component.onSubmit();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('form')).toBeNull();
    expect(host.querySelector('[data-testid="booking-request-header"]')).toBeNull();
    expect(host.querySelector('h1')?.textContent).toBe('Demande envoyée');
    expect(host.querySelector('[role="status"]')?.textContent).toContain('Votre demande est en cours de traitement.');
    expect(host.querySelector('[data-testid="confirmation-route"]')?.textContent).toContain('Paris');
    expect(host.querySelector('[data-testid="confirmation-route"]')?.textContent).toContain('Abidjan');
    expect(host.querySelector('[data-testid="confirmation-route"]')?.textContent).toContain('5 €/kg');
    expect(host.querySelectorAll('ol li').length).toBe(3);
    expect(host.textContent).toContain('Le voyageur a reçu votre demande.');
    expect(host.textContent).toContain('En attente de son acceptation.');
    expect(host.querySelector('a[data-testid="booking-follow-link"]')?.getAttribute('href')).toBe('/sent-bookings/10/1');
    expect(host.querySelector('a[data-testid="booking-results-link"]')?.getAttribute('href')).toBe('/search');
  });

  for (const delivery of [
    { status: 'DELIVERED', channel: 'EMAIL', text: 'Le code a été envoyé à l’adresse e-mail de votre compte.' },
    { status: 'FAILED', channel: 'EMAIL', text: 'L’envoi du code a échoué.' },
    { status: 'INVALIDATED', channel: 'EMAIL', text: 'Le code a été invalidé.' },
    { status: undefined, channel: undefined, text: 'Consultez le suivi de votre demande pour connaître l’état du code.' },
    { status: 'DELIVERED', channel: 'SMS', text: 'Consultez le suivi de votre demande pour connaître l’état du code.' },
  ]) {
    it(`shows accepted bookings with truthful code delivery information (${delivery.status}/${delivery.channel})`, () => {
      const booking = { id: 1, tripId: 10, status: 'ACCEPTED', validationDeliveryStatus: delivery.status, validationDeliveryChannel: delivery.channel };
      tripServiceMock.createBooking.and.returnValue(of(booking));
      prepareValidSubmission();
      component.onSubmit();
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;

      expect(host.querySelector('[role="status"]')?.textContent).toContain('Votre demande a été acceptée.');
      expect(host.textContent).not.toContain('En attente de son acceptation.');
      expect(host.textContent).toContain(delivery.text);
      if (delivery.status !== 'DELIVERED' || delivery.channel !== 'EMAIL') {
        expect(host.textContent).not.toContain('Le code a été envoyé');
      }
    });
  }

  it('keeps photo failures recoverable without creating a duplicate booking', () => {
    prepareValidSubmission();
    component.currentStep = 2;
    component.selectedPhoto = new File(['image'], 'parcel.png', { type: 'image/png' });
    tripServiceMock.uploadBookingPhoto.and.returnValue(throwError(() => new Error('upload failure')));
    const created = spyOn(component.bookingCreated, 'emit');
    component.onSubmit();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="booking-confirmation"]')).toBeNull();
    expect(created).not.toHaveBeenCalled();
    component.onSubmit();
    expect(tripServiceMock.createBooking).toHaveBeenCalledTimes(1);

    tripServiceMock.uploadBookingPhoto.and.returnValue(of(component.createdBooking!));
    Array.from(host.querySelectorAll('button')).find(button => button.textContent?.trim() === 'Réessayer la photo')?.click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="booking-confirmation"]')).not.toBeNull();
    expect(created).toHaveBeenCalledTimes(1);
    expect(tripServiceMock.createBooking).toHaveBeenCalledTimes(1);
  });

  it('prevents repeated submissions while creating a booking', () => {
    const pending = new Subject<BookingResponse>();
    tripServiceMock.createBooking.and.returnValue(pending);
    prepareValidSubmission();
    component.onSubmit();
    component.onSubmit();
    expect(tripServiceMock.createBooking).toHaveBeenCalledTimes(1);
    expect(component.successMessage).toBe('');
    pending.error(new Error('network failure'));
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="booking-confirmation"]')).toBeNull();
    expect(component.isLoading).toBeFalse();
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
