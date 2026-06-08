import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BookingResponse } from '../../models/booking.model';
import { Trip } from '../../models/trip.model';
import { AuthService } from '../../services/auth.service';
import { MessagingService } from '../../services/messaging.service';
import { TripService } from '../../services/trip.service';

interface SenderReview {
  author: string;
  date: string;
  rating: number;
  comment: string;
}

@Component({
  selector: 'app-reservation-sender-profile-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './reservation-sender-profile-page.component.html',
})
export class ReservationSenderProfilePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly tripService = inject(TripService);
  private readonly messagingService = inject(MessagingService);

  trip: Trip | null = null;
  booking: BookingResponse | null = null;
  isLoading = true;
  isProcessing = false;
  loadError = '';
  actionError = '';
  isMobileMenuOpen = false;

  private profilePhotoLoadFailed = false;
  private lastProfilePhotoUrl: string | null = null;
  private senderPhotoLoadFailed = false;
  private lastSenderPhotoUrl: string | null = null;

  private readonly completedTripsStat = 142;
  private readonly sentPackagesStat = 8;

  readonly senderReviews: SenderReview[] = [
    {
      author: 'Marc Bernard',
      date: '12 mars 2024',
      rating: 5,
      comment: 'Très fiable et professionnel. Communication claire du début à la fin.',
    },
    {
      author: 'Alice Leroy',
      date: '28 février 2024',
      rating: 5,
      comment: 'Livraison rapide, très bonne organisation et ponctualité.',
    },
    {
      author: 'John Chen',
      date: '15 février 2024',
      rating: 5,
      comment: 'Expérience fluide, colis manipulé avec soin. Je recommande.',
    },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const tripId = Number(params.get('tripId'));
      const bookingId = Number(params.get('bookingId'));

      if (!Number.isInteger(tripId) || tripId <= 0 || !Number.isInteger(bookingId) || bookingId <= 0) {
        this.trip = null;
        this.booking = null;
        this.loadError = 'Impossible de charger ce profil utilisateur.';
        this.isLoading = false;
        return;
      }

      this.loadSenderProfile(tripId, bookingId);
    });
  }

  currentUserName(): string {
    const user = this.authService.getUser();
    const name = [user?.firstName?.trim(), user?.lastName?.trim()]
      .filter((value): value is string => !!value)
      .join(' ')
      .trim();

    return name || 'Mon espace';
  }

  currentUserEmail(): string {
    return this.authService.getUser()?.email ?? '';
  }

  hasUserPhoto(): boolean {
    return !!this.userPhotoUrl();
  }

  userPhotoUrl(): string | null {
    const photoUrl = this.authService.getUser()?.photoUrl?.trim() ?? null;
    if (!photoUrl) {
      this.profilePhotoLoadFailed = false;
      this.lastProfilePhotoUrl = null;
      return null;
    }

    if (photoUrl !== this.lastProfilePhotoUrl) {
      this.profilePhotoLoadFailed = false;
      this.lastProfilePhotoUrl = photoUrl;
    }

    return this.profilePhotoLoadFailed ? null : photoUrl;
  }

  userInitials(): string {
    const user = this.authService.getUser();
    const firstInitial = user?.firstName?.trim().charAt(0) ?? '';
    const lastInitial = user?.lastName?.trim().charAt(0) ?? '';
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();

    if (initials) {
      return initials;
    }

    return user?.email?.trim().charAt(0).toUpperCase() ?? 'U';
  }

  onUserPhotoError(): void {
    this.profilePhotoLoadFailed = true;
  }

  logout(): void {
    this.authService.logout();
  }

  openMobileMenu(): void {
    this.isMobileMenuOpen = true;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  senderName(): string {
    return this.booking?.senderName ?? 'Profil utilisateur';
  }

  senderInitial(): string {
    return this.senderName().trim().charAt(0).toUpperCase() || '?';
  }

  senderPhotoUrl(): string | null {
    const photoUrl = this.booking?.senderPhotoUrl?.trim() ?? null;
    if (!photoUrl) {
      this.senderPhotoLoadFailed = false;
      this.lastSenderPhotoUrl = null;
      return null;
    }

    if (photoUrl !== this.lastSenderPhotoUrl) {
      this.senderPhotoLoadFailed = false;
      this.lastSenderPhotoUrl = photoUrl;
    }

    return this.senderPhotoLoadFailed ? null : photoUrl;
  }

  onSenderPhotoError(): void {
    this.senderPhotoLoadFailed = true;
  }

  hasSenderReviews(): boolean {
    return this.senderReviewCount() > 0 && this.senderReviewAverage() > 0;
  }

  senderReviewAverage(): number {
    return this.booking?.senderRatingAverage ?? 0;
  }

  senderReviewAverageLabel(): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(this.senderReviewAverage());
  }

  senderReviewCount(): number {
    return this.booking?.senderRatingCount ?? 0;
  }

  senderReviewCountLabel(): string {
    return `${this.senderReviewCount()} avis`;
  }

  profileDescription(): string {
    const description = this.booking?.description?.trim();
    if (description) {
      return description;
    }

    return 'Cet utilisateur n’a pas encore ajouté de description.';
  }

  completedTripsLabel(): string {
    return new Intl.NumberFormat('fr-FR').format(this.completedTripsStat);
  }

  sentPackagesLabel(): string {
    return new Intl.NumberFormat('fr-FR').format(this.sentPackagesStat);
  }

  reviewStars(rating: number): number[] {
    const clampedRating = Math.max(0, Math.min(5, Math.round(rating)));
    return Array.from({ length: clampedRating }, (_, index) => index);
  }

  messageSender(): void {
    if (!this.trip || !this.booking || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.actionError = '';
    this.messagingService.startConversation({
      tripId: this.trip.id,
      recipientId: this.booking.senderId,
      content:
        `Bonjour, je vous contacte au sujet de votre réservation "${this.booking.title}" `
        + `pour mon trajet ${this.trip.departureAddress} vers ${this.trip.destination}.`,
    }).subscribe({
      next: () => {
        this.isProcessing = false;
        void this.router.navigate(['/messages']);
      },
      error: () => {
        this.actionError = 'Impossible de démarrer la conversation.';
        this.isProcessing = false;
      },
    });
  }

  private loadSenderProfile(tripId: number, bookingId: number): void {
    this.isLoading = true;
    this.isProcessing = false;
    this.loadError = '';
    this.actionError = '';

    forkJoin({
      trip: this.tripService.getTripById(tripId),
      bookings: this.tripService.getTripBookings(tripId),
    }).subscribe({
      next: ({ trip, bookings }) => {
        this.trip = trip;
        this.booking = bookings.find((currentBooking) => currentBooking.id === bookingId) ?? null;
        this.isLoading = false;

        if (!this.booking) {
          this.loadError = 'Impossible de retrouver ce profil pour cette réservation.';
        }
      },
      error: () => {
        this.trip = null;
        this.booking = null;
        this.loadError = 'Impossible de charger ce profil utilisateur.';
        this.isLoading = false;
      },
    });
  }
}
