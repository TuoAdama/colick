import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalyticsService } from '../../services/analytics.service';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { BookingRequestFormComponent } from '../../shared/components/booking-request-form/booking-request-form.component';
import { BookingResponse } from '../../models/booking.model';
import { Trip } from '../../models/trip.model';

@Component({
  selector: 'app-booking-request-page',
  standalone: true,
  imports: [CommonModule, BookingRequestFormComponent],
  templateUrl: './booking-request-page.component.html',
})
export class BookingRequestPageComponent implements OnInit {
  @ViewChild(BookingRequestFormComponent) private requestForm?: BookingRequestFormComponent;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tripService = inject(TripService);
  private readonly authService = inject(AuthService);
  private readonly analytics = inject(AnalyticsService);

  trip: Trip | null = null;
  initialWeight: number | null = null;
  isLoading = true;
  errorMessage = '';
  returnUrl = '/search';
  resultsReturnUrl = '/search';
  bookingSubmitted = false;

  ngOnInit(): void {
    const reference = this.route.snapshot.paramMap.get('reference')?.trim() ?? '';
    this.returnUrl = this.getSafeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
    const resultsUrl = this.route.snapshot.queryParamMap.get('resultsReturnUrl') ?? this.returnUrl;
    this.resultsReturnUrl = /^\/search(?:[?#]|$)/.test(resultsUrl) ? resultsUrl : '/search';
    this.initialWeight = this.parseWeight(this.route.snapshot.queryParamMap.get('weight'));

    if (!reference) {
      this.isLoading = false;
      this.errorMessage = 'Cette annonce est introuvable ou n’est plus disponible.';
      return;
    }

    this.tripService.getTripByReference(reference).subscribe({
      next: trip => {
        this.trip = trip;
        this.isLoading = false;
        if (this.authService.getUser()?.id === trip.travelerId) {
          this.errorMessage = 'Vous ne pouvez pas envoyer une demande pour votre propre trajet.';
          this.trip = null;
          return;
        }

        this.analytics.track('request_started', {
          trip_id: trip.id,
          trip_reference: trip.reference,
          source: this.getRequestSource(this.route.snapshot.queryParamMap.get('source')),
        });
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Cette annonce est introuvable ou n’est plus disponible.';
      },
    });
  }

  goBack(): void {
    void this.router.navigateByUrl(this.returnUrl);
  }

  goBackFromRequest(): void {
    if (this.requestForm?.currentStep === 2) {
      this.requestForm.backToDetails();
      return;
    }
    this.goBack();
  }

  onBookingCreated(booking: BookingResponse): void {
    this.bookingSubmitted = true;
    this.analytics.track('request_submitted', {
      trip_id: booking.tripId,
      booking_id: booking.id,
      status: booking.status,
    });
  }

  private getSafeReturnUrl(value: string | null): string {
    const fallback = '/search';
    const candidate = value?.trim() ?? '';
    return candidate.startsWith('/') && !candidate.startsWith('//')
      ? candidate
      : fallback;
  }

  private getRequestSource(value: string | null): 'search_results' | 'landing_recommended' | 'trip_reference' {
    if (value === 'search_results' || value === 'landing_recommended') {
      return value;
    }
    return 'trip_reference';
  }

  private parseWeight(value: string | null): number | null {
    if (value === null || value.trim() === '') return null;
    const weight = Number(value);
    return Number.isFinite(weight) && weight > 0 ? weight : null;
  }
}
