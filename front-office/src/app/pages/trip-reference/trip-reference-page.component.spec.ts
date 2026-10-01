import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Trip } from '../../models/trip.model';
import { AuthService } from '../../services/auth.service';
import { MessagingService } from '../../services/messaging.service';
import { TripService } from '../../services/trip.service';
import { TripReferencePageComponent } from './trip-reference-page.component';
import { BookingModalComponent } from '../../shared/components/booking-modal/booking-modal.component';

describe('TripReferencePageComponent', () => {
  let fixture: ComponentFixture<TripReferencePageComponent>;
  let component: TripReferencePageComponent;
  let router: Router;
  const paramMap$ = new BehaviorSubject(convertToParamMap({ reference: 'TRP-2026-000013' }));

  const tripServiceMock = {
    getTripByReference: jasmine.createSpy('getTripByReference'),
    createBooking: jasmine.createSpy('createBooking'),
  };

  const authServiceMock = {
    isLoggedIn: jasmine.createSpy('isLoggedIn'),
    getUser: jasmine.createSpy('getUser'),
  };

  const messagingServiceMock = {
    createConversationDraft: jasmine.createSpy('createConversationDraft'),
  };

  beforeEach(async () => {
    paramMap$.next(convertToParamMap({ reference: 'TRP-2026-000013' }));
    tripServiceMock.getTripByReference.calls.reset();
    tripServiceMock.createBooking.calls.reset();
    messagingServiceMock.createConversationDraft.calls.reset();
    tripServiceMock.getTripByReference.and.returnValue(of(buildTrip()));
    tripServiceMock.createBooking.and.returnValue(of({ id: 1, title: 'Colis', tripId: 13 }));
    messagingServiceMock.createConversationDraft.and.returnValue(of({
      id: 42,
      otherParticipantId: 2,
      otherParticipantName: 'Alice Martin',
      lastMessage: null,
      unreadCount: 0,
      createdAt: '2026-07-03T10:00:00Z',
    }));
    authServiceMock.isLoggedIn.calls.reset();
    authServiceMock.getUser.calls.reset();
    authServiceMock.isLoggedIn.and.returnValue(false);
    authServiceMock.getUser.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [TripReferencePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable(),
          },
        },
        { provide: TripService, useValue: tripServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: MessagingService, useValue: messagingServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TripReferencePageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOnProperty(router, 'url', 'get').and.returnValue('/trips/ref/TRP-2026-000013');
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  it('loads and displays the trip matching the reference', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(tripServiceMock.getTripByReference).toHaveBeenCalledWith('TRP-2026-000013');
    expect(host.textContent).toContain('TRP-2026-000013');
    expect(host.textContent).toContain('Paris, France');
    expect(host.textContent).toContain("Abidjan, Côte d'Ivoire");
    expect(host.textContent).toContain('8 kg disponibles');
    expect(host.textContent).toContain('Envoyer une demande');
    expect(host.textContent).toContain('Contacter le voyageur');
  });

  it('uses smaller typography on mobile while preserving the desktop sizes', () => {
    const host = fixture.nativeElement as HTMLElement;
    const content = host.querySelector('main > div');

    expect(content?.className).toContain('pt-24');
    expect(host.querySelector('h1')?.className).toContain('text-xl');
    expect(host.querySelector('h1')?.className).toContain('sm:text-4xl');

    const dateValues = host.querySelectorAll('.rounded-xl.border p:nth-child(2)');
    expect(dateValues[0].className).toContain('text-base');
    expect(dateValues[0].className).toContain('sm:text-xl');

    const prices = host.querySelectorAll('aside .rounded-xl p:nth-child(2)');
    expect(prices[0].className).toContain('text-2xl');
    expect(prices[0].className).toContain('sm:text-4xl');
  });

  it('shows a fixed mobile booking bar with an estimate based on the selected weight', () => {
    const host = fixture.nativeElement as HTMLElement;
    const bar = host.querySelector('[aria-label="Estimation et envoi de la demande"]');
    const weightInput = host.querySelector('#mobile-booking-weight') as HTMLInputElement;

    expect(bar?.className).toContain('fixed');
    expect(bar?.className).toContain('md:hidden');
    expect(weightInput.value).toBe('1');
    expect(bar?.textContent).toContain('12,00');

    weightInput.value = '2.5';
    weightInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.estimatedBookingPrice()).toContain('30,00');
  });

  it('disables the mobile booking action when the selected weight exceeds availability', () => {
    const host = fixture.nativeElement as HTMLElement;
    const weightInput = host.querySelector('#mobile-booking-weight') as HTMLInputElement;
    const submitButton = host.querySelector('[data-testid="mobile-book-reference-trip-button"]') as HTMLButtonElement;

    weightInput.value = '8.1';
    weightInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.canSubmitBookingWeight()).toBeFalse();
    expect(submitButton.disabled).toBeTrue();
    expect(component.estimatedBookingPrice()).toBe('—');
  });

  it('opens the booking modal with the weight selected in the mobile bar', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    authServiceMock.getUser.and.returnValue({ id: 99 });
    const host = fixture.nativeElement as HTMLElement;
    const weightInput = host.querySelector('#mobile-booking-weight') as HTMLInputElement;
    weightInput.value = '2.5';
    weightInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (host.querySelector('[data-testid="mobile-book-reference-trip-button"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const modal = fixture.debugElement.query(By.directive(BookingModalComponent)).componentInstance as BookingModalComponent;
    expect(modal.isOpen).toBeTrue();
    expect(modal.bookingForm.controls.weight.value).toBe(2.5);
  });

  it('redirects anonymous users to login when they use the mobile booking action', () => {
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="mobile-book-reference-trip-button"]')!
      .click();

    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/trips/ref/TRP-2026-000013' },
    });
    expect(component.isBookingModalOpen).toBeFalse();
  });

  it('does not show the mobile booking bar for the traveler’s own trip', () => {
    authServiceMock.getUser.and.returnValue({ id: 2 });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="mobile-book-reference-trip-button"]')).toBeNull();
  });

  it('redirects anonymous users to login with returnUrl when booking is requested', () => {
    component.openBookingModal();

    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/trips/ref/TRP-2026-000013' },
    });
    expect(component.isBookingModalOpen).toBeFalse();
  });

  it('opens the booking modal for authenticated users', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    authServiceMock.getUser.and.returnValue({ id: 99 });

    component.openBookingModal();

    expect(component.isBookingModalOpen).toBeTrue();
  });

  it('redirects anonymous users to login with returnUrl when contact is requested', () => {
    component.contactTraveler();

    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/trips/ref/TRP-2026-000013' },
    });
    expect(messagingServiceMock.createConversationDraft).not.toHaveBeenCalled();
  });

  it('creates a draft conversation with the traveler for authenticated users', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    authServiceMock.getUser.and.returnValue({ id: 99 });

    component.contactTraveler();

    expect(messagingServiceMock.createConversationDraft).toHaveBeenCalledWith({
      tripId: 13,
      recipientId: 2,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/messages'], {
      queryParams: { conversationId: 42 },
    });
  });

  it('shows an error when the draft conversation cannot be created', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    authServiceMock.getUser.and.returnValue({ id: 99 });
    messagingServiceMock.createConversationDraft.and.returnValue(throwError(() => new Error('failed')));

    component.contactTraveler();
    fixture.detectChanges();

    expect(component.actionErrorMessage).toContain('Impossible de démarrer la conversation');
    expect(component.isContactingTraveler).toBeFalse();
  });

  it('shows an error when the reference cannot be resolved', () => {
    tripServiceMock.getTripByReference.and.returnValue(throwError(() => new Error('not found')));
    paramMap$.next(convertToParamMap({ reference: 'TRP-404' }));
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(component.trip).toBeNull();
    expect(host.textContent).toContain('Annonce introuvable');
    expect(host.querySelector('[data-testid="mobile-book-reference-trip-button"]')).toBeNull();
  });
});

function buildTrip(): Trip {
  return {
    id: 13,
    reference: 'TRP-2026-000013',
    travelerId: 2,
    travelerName: 'Alice Martin',
    travelerRatingAverage: 4.8,
    travelerRatingCount: 12,
    departureAddress: 'Paris, France',
    destination: "Abidjan, Côte d'Ivoire",
    departureTime: '2026-07-14T12:00:00Z',
    arrivalTime: '2026-07-14T20:00:00Z',
    maxWeight: 20,
    availableWeight: 8,
    pricePerKilo: 12,
    instantAcceptance: true,
    status: 'ACTIVE',
  };
}
