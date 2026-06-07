import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BookingResponse } from '../../models/booking.model';
import { Trip } from '../../models/trip.model';
import { BookingRequestCardComponent } from '../../components/reservation-details/booking-request-card/booking-request-card.component';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { MessagingService } from '../../services/messaging.service';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

type ReservationStatusTab = 'ALL' | BookingResponse['status'];

@Component({
  selector: 'app-reservation-details-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    BookingRequestCardComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './reservation-details-page.component.html',
})
export class ReservationDetailsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly tripService = inject(TripService);
  private readonly messagingService = inject(MessagingService);

  trip: Trip | null = null;
  bookings: BookingResponse[] = [];
  isLoading = true;
  loadError = '';
  actionError = '';
  isCompletingTrip = false;
  isCancellingTrip = false;
  processingBookingId: number | null = null;
  isCancelTripModalOpen = false;
  isRemoveBookingModalOpen = false;
  pendingRemoveBookingId: number | null = null;
  selectedTab: ReservationStatusTab = 'ALL';
  currentPage = 1;
  tripSummaryExpanded = false;
  showExtendedFilters = false;

  private profilePhotoLoadFailed = false;
  private lastProfilePhotoUrl: string | null = null;

  readonly pageSize = 4;
  readonly primaryStatusTabs: ReadonlyArray<{ value: ReservationStatusTab; label: string }> = [
    { value: 'PENDING', label: 'En attentes' },
    { value: 'ACCEPTED', label: 'Acceptées' },
  ];
  readonly extendedStatusTabs: ReadonlyArray<{ value: ReservationStatusTab; label: string }> = [
    { value: 'REJECTED', label: 'Refusées' },
    { value: 'CANCELLED', label: 'Annulées' },
    { value: 'REMOVED', label: 'Retirées' },
    { value: 'ALL', label: 'Toutes' },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const tripId = Number(params.get('tripId'));

      if (!Number.isInteger(tripId) || tripId <= 0) {
        this.trip = null;
        this.bookings = [];
        this.loadError = 'Impossible de charger les détails de cette réservation.';
        this.isLoading = false;
        return;
      }

      this.loadReservationDetails(tripId);
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

  toggleTripSummary(): void {
    this.tripSummaryExpanded = !this.tripSummaryExpanded;
  }

  toggleExtendedFilters(): void {
    this.showExtendedFilters = !this.showExtendedFilters;
  }

  hasExtendedStatuses(): boolean {
    return this.extendedStatusTabs.some((tab) => this.bookingCountForStatus(tab.value) > 0);
  }

  tripStatusLabel(status: Trip['status']): string {
    return ({
      ACTIVE: 'Actif',
      COMPLETED: 'Terminé',
      CANCELLED: 'Annulé',
    } as Record<Trip['status'], string>)[status];
  }

  tripStatusClass(status: Trip['status']): string {
    return ({
      ACTIVE: 'border-[#c1c6d5] bg-[#e0e2eb] text-[#414753]',
      COMPLETED: 'border-[#b6d0ff] bg-[#b6d0ff]/30 text-[#3f5881]',
      CANCELLED: 'border-error/20 bg-error/10 text-error',
    } as Record<Trip['status'], string>)[status];
  }

  selectTab(tab: ReservationStatusTab): void {
    this.selectedTab = tab;
    this.currentPage = 1;
  }

  filteredBookings(): BookingResponse[] {
    if (this.selectedTab === 'ALL') {
      return this.bookings;
    }

    return this.bookings.filter((booking) => booking.status === this.selectedTab);
  }

  paginatedBookings(): BookingResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredBookings().slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredBookings().length / this.pageSize));
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, index) => index + 1);
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages());
  }

  currentRangeEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredBookings().length);
  }

  bookingCountForStatus(status: ReservationStatusTab): number {
    if (status === 'ALL') {
      return this.bookings.length;
    }

    return this.bookings.filter((booking) => booking.status === status).length;
  }

  demandedWeight(): number {
    return this.bookings
      .filter((booking) => booking.status === 'PENDING' || booking.status === 'ACCEPTED')
      .reduce((total, booking) => total + (Number.isFinite(booking.weight) ? booking.weight : 0), 0);
  }

  remainingWeight(): number {
    if (!this.trip) {
      return 0;
    }

    return Math.max(this.trip.maxWeight - this.demandedWeight(), 0);
  }

  usedWeight(): number {
    return this.demandedWeight();
  }

  usedWeightPercentage(): number {
    if (!this.trip || this.trip.maxWeight <= 0) {
      return 0;
    }

    return Math.min((this.usedWeight() / this.trip.maxWeight) * 100, 100);
  }

  editTrip(): void {
    if (!this.trip) {
      return;
    }

    void this.router.navigate(['/propose', this.trip.id]);
  }

  markTripCompleted(): void {
    if (!this.trip || this.isCompletingTrip || this.isCancellingTrip) {
      return;
    }

    this.isCompletingTrip = true;
    this.actionError = '';
    this.tripService.completeTrip(this.trip.id).subscribe({
      next: (updatedTrip) => {
        this.trip = updatedTrip;
        this.isCompletingTrip = false;
      },
      error: (error: { error?: { message?: string } }) => {
        this.actionError = error.error?.message || 'Impossible de marquer ce trajet comme terminé.';
        this.isCompletingTrip = false;
      },
    });
  }

  openCancelTripModal(): void {
    if (!this.trip || this.isCompletingTrip || this.isCancellingTrip) {
      return;
    }

    this.isCancelTripModalOpen = true;
  }

  closeCancelTripModal(): void {
    this.isCancelTripModalOpen = false;
  }

  confirmCancelTrip(): void {
    if (!this.trip || this.isCancellingTrip) {
      return;
    }

    this.isCancellingTrip = true;
    this.actionError = '';
    this.tripService.cancelTrip(this.trip.id).subscribe({
      next: () => {
        this.isCancellingTrip = false;
        this.isCancelTripModalOpen = false;
        this.navigateBackToDashboard();
      },
      error: (error: { error?: { message?: string } }) => {
        this.actionError = error.error?.message || "Impossible d'annuler ce trajet pour le moment.";
        this.isCancellingTrip = false;
        this.isCancelTripModalOpen = false;
      },
    });
  }

  acceptBooking(bookingId: number): void {
    if (!this.trip || this.processingBookingId !== null) {
      return;
    }

    this.processingBookingId = bookingId;
    this.actionError = '';
    this.tripService.acceptBooking(this.trip.id, bookingId).subscribe({
      next: (updatedBooking) => {
        this.updateBooking(updatedBooking);
        this.processingBookingId = null;
      },
      error: (error: { error?: { message?: string } }) => {
        this.actionError = error.error?.message || "Impossible d'accepter cette réservation.";
        this.processingBookingId = null;
      },
    });
  }

  rejectBooking(bookingId: number): void {
    if (!this.trip || this.processingBookingId !== null) {
      return;
    }

    this.processingBookingId = bookingId;
    this.actionError = '';
    this.tripService.rejectBooking(this.trip.id, bookingId).subscribe({
      next: (updatedBooking) => {
        this.updateBooking(updatedBooking);
        this.processingBookingId = null;
      },
      error: (error: { error?: { message?: string } }) => {
        this.actionError = error.error?.message || 'Impossible de refuser cette réservation.';
        this.processingBookingId = null;
      },
    });
  }

  openRemoveBookingModal(bookingId: number): void {
    if (this.processingBookingId !== null) {
      return;
    }

    this.pendingRemoveBookingId = bookingId;
    this.isRemoveBookingModalOpen = true;
  }

  closeRemoveBookingModal(): void {
    this.pendingRemoveBookingId = null;
    this.isRemoveBookingModalOpen = false;
  }

  confirmRemoveBooking(): void {
    if (!this.trip || this.pendingRemoveBookingId === null || this.processingBookingId !== null) {
      return;
    }

    const bookingId = this.pendingRemoveBookingId;
    this.processingBookingId = bookingId;
    this.actionError = '';
    this.tripService.removeBooking(this.trip.id, bookingId).subscribe({
      next: () => {
        this.bookings = this.bookings.filter((booking) => booking.id !== bookingId);
        this.clampCurrentPage();
        this.processingBookingId = null;
        this.closeRemoveBookingModal();
      },
      error: (error: { error?: { message?: string } }) => {
        this.actionError = error.error?.message || 'Impossible de retirer cette réservation.';
        this.processingBookingId = null;
        this.closeRemoveBookingModal();
      },
    });
  }

  messageSender(bookingId: number): void {
    if (!this.trip || this.processingBookingId !== null) {
      return;
    }

    const booking = this.bookings.find((currentBooking) => currentBooking.id === bookingId);
    if (!booking) {
      return;
    }

    this.processingBookingId = bookingId;
    this.actionError = '';
    this.messagingService.startConversation({
      tripId: this.trip.id,
      recipientId: booking.senderId,
      content:
        `Bonjour, je vous contacte au sujet de votre réservation "${booking.title}" `
        + `pour mon trajet ${this.trip.departureAddress} vers ${this.trip.destination}.`,
    }).subscribe({
      next: () => {
        this.processingBookingId = null;
        void this.router.navigate(['/messages']);
      },
      error: () => {
        this.actionError = 'Impossible de démarrer la conversation.';
        this.processingBookingId = null;
      },
    });
  }

  confirmBookingDelivery(payload: { bookingId: number; code: string }): void {
    if (!this.trip || this.processingBookingId !== null) {
      return;
    }

    const validationCode = payload.code.trim();
    if (!/^\d{6}$/.test(validationCode)) {
      this.actionError = 'Saisissez un code de validation à 6 chiffres.';
      return;
    }

    this.processingBookingId = payload.bookingId;
    this.actionError = '';
    this.tripService.confirmBookingDelivery(this.trip.id, payload.bookingId, { validationCode }).subscribe({
      next: (updatedBooking) => {
        this.updateBooking(updatedBooking);
        this.processingBookingId = null;
      },
      error: (error: { error?: { message?: string } }) => {
        this.actionError = error.error?.message || 'Impossible de confirmer la remise du colis.';
        this.processingBookingId = null;
      },
    });
  }

  isBookingProcessing(bookingId: number): boolean {
    return this.processingBookingId === bookingId;
  }

  isPendingRemoveBookingProcessing(): boolean {
    return this.pendingRemoveBookingId !== null && this.isBookingProcessing(this.pendingRemoveBookingId);
  }

  private loadReservationDetails(tripId: number): void {
    this.isLoading = true;
    this.loadError = '';
    this.actionError = '';
    this.processingBookingId = null;
    this.tripSummaryExpanded = false;
    this.showExtendedFilters = false;
    this.closeRemoveBookingModal();
    this.closeCancelTripModal();

    forkJoin({
      trip: this.tripService.getTripById(tripId),
      bookings: this.tripService.getTripBookings(tripId),
    }).subscribe({
      next: ({ trip, bookings }) => {
        this.trip = trip;
        this.bookings = bookings;
        this.selectedTab = this.getDefaultStatusTab(bookings);
        this.currentPage = 1;
        this.isLoading = false;
      },
      error: () => {
        this.trip = null;
        this.bookings = [];
        this.loadError = 'Impossible de charger les détails de cette réservation.';
        this.isLoading = false;
      },
    });
  }

  private updateBooking(updatedBooking: BookingResponse): void {
    this.bookings = this.bookings.map((booking) =>
      booking.id === updatedBooking.id ? updatedBooking : booking
    );
    this.clampCurrentPage();
  }

  private navigateBackToDashboard(): void {
    void this.router.navigate(['/dashboard'], {
      queryParams: { tab: 'received' },
    });
  }

  private clampCurrentPage(): void {
    this.currentPage = Math.min(this.currentPage, this.totalPages());
    this.currentPage = Math.max(this.currentPage, 1);
  }

  private getDefaultStatusTab(bookings: BookingResponse[]): ReservationStatusTab {
    if (bookings.some((booking) => booking.status === 'PENDING')) {
      return 'PENDING';
    }

    if (bookings.some((booking) => booking.status === 'ACCEPTED')) {
      return 'ACCEPTED';
    }

    return 'ALL';
  }
}
