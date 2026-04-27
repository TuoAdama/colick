import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { Trip } from '../../models/trip.model';
import { BookingResponse } from '../../models/booking.model';
import { UpdateProfileRequest } from '../../models/auth.model';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

type Tab = 'profile' | 'chats' | 'received' | 'sent';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, ConfirmModalComponent],
  templateUrl: './dashboard-page.component.html',
})
export class DashboardPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly tripService = inject(TripService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  activeTab: Tab = 'profile';

  /** Tab definitions with labels and inline SVG icons. */
  tabs = [
    { id: 'profile' as Tab, label: 'Mon profil', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>' },
    { id: 'chats' as Tab, label: 'Mes chats', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>' },
    { id: 'received' as Tab, label: 'Réservations reçues', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>' },
    { id: 'sent' as Tab, label: 'Mes demandes', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>' },
  ];

  // ── Section 1: Informations générales ─────────────────────────────────────
  infoForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: [''],
    identityDocument: ['', Validators.required],
  });
  infoSuccess = '';
  infoError = '';
  isSavingInfo = false;

  // Photo
  photoPreview: string | null = null;
  selectedPhotoFile: File | null = null;
  isUploadingPhoto = false;
  photoError = '';

  // ── Section 2: Changer l'e-mail ───────────────────────────────────────────
  emailForm = this.fb.group({
    newEmail: ['', [Validators.required, Validators.email]],
  });
  emailSuccess = '';
  emailError = '';
  isSendingEmail = false;

  // ── Section 3: Changer le mot de passe ────────────────────────────────────
  passwordForm = this.fb.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });
  passwordSuccess = '';
  passwordError = '';
  isSavingPassword = false;

  // ── Received reservations ─────────────────────────────────────────────────
  myTrips: Trip[] = [];
  tripBookingsMap: Record<number, BookingResponse[]> = {};
  selectedTripBookings: BookingResponse[] = [];
  selectedTripId: number | null = null;
  isLoadingTrips = false;
  isLoadingBookings = false;
  bookingActionError = '';
  isCancellingTrip = false;
  isCompletingTrip = false;
  deliveryCodeByBookingId: Record<number, string> = {};
  validatingDeliveryBookingId: number | null = null;

  // ── Remove booking confirmation modal ─────────────────────────────────────
  isRemoveModalOpen = false;
  pendingRemoveBookingId: number | null = null;
  isRemoving = false;

  // ── Sent requests ─────────────────────────────────────────────────────────
  myBookings: BookingResponse[] = [];
  isLoadingSentBookings = false;

  /** Observable stream of the currently authenticated user. */
  currentUser$ = this.authService.currentUser$;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    const user = this.authService.getUser();
    if (user) {
      this.infoForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? '',
        identityDocument: user.identityDocument ?? '',
      });
      this.photoPreview = user.photoUrl ?? null;
    }

    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab');
      if (this.isTab(tab)) this.setTab(tab);
    });
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
    if (tab === 'received' && this.myTrips.length === 0) this.loadMyTrips();
    if (tab === 'sent' && this.myBookings.length === 0) this.loadSentBookings();
  }

  private isTab(value: string | null): value is Tab {
    return value === 'profile' || value === 'chats' || value === 'received' || value === 'sent';
  }

  // ── Photo ─────────────────────────────────────────────────────────────────
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.selectedPhotoFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.photoPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
    this.uploadPhoto();
  }

  uploadPhoto(): void {
    const user = this.authService.getUser();
    if (!user || !this.selectedPhotoFile) return;
    this.isUploadingPhoto = true;
    this.photoError = '';
    this.authService.uploadPhoto(user.id, this.selectedPhotoFile).subscribe({
      next: () => { this.isUploadingPhoto = false; },
      error: () => { this.photoError = "Erreur lors de l'upload de la photo."; this.isUploadingPhoto = false; },
    });
  }

  // ── Infos générales ──────────────────────────────────────────────────────
  saveInfo(): void {
    if (this.infoForm.invalid || this.isSavingInfo) return;
    const user = this.authService.getUser();
    if (!user) return;
    this.isSavingInfo = true;
    this.infoSuccess = '';
    this.infoError = '';
    const val = this.infoForm.value;
    const payload: UpdateProfileRequest = {
      firstName: val.firstName ?? undefined,
      lastName: val.lastName ?? undefined,
      phone: val.phone || undefined,
      identityDocument: val.identityDocument || undefined,
    };
    this.authService.updateProfile(user.id, payload).subscribe({
      next: () => { this.infoSuccess = 'Informations mises à jour.'; this.isSavingInfo = false; },
      error: () => { this.infoError = 'Erreur lors de la mise à jour.'; this.isSavingInfo = false; },
    });
  }

  // ── Email ────────────────────────────────────────────────────────────────
  sendEmailChange(): void {
    if (this.emailForm.invalid || this.isSendingEmail) return;
    const user = this.authService.getUser();
    if (!user) return;
    this.isSendingEmail = true;
    this.emailSuccess = '';
    this.emailError = '';
    const newEmail = this.emailForm.value.newEmail!;
    this.authService.requestEmailChange(user.id, newEmail).subscribe({
      next: () => {
        this.emailSuccess = `Un lien de confirmation a été envoyé à ${newEmail}. Vérifiez votre boîte mail.`;
        this.emailForm.reset();
        this.isSendingEmail = false;
      },
      error: () => { this.emailError = "Erreur lors de l'envoi. L'adresse est peut-être déjà utilisée."; this.isSendingEmail = false; },
    });
  }

  // ── Password ─────────────────────────────────────────────────────────────
  savePassword(): void {
    if (this.passwordForm.invalid || this.isSavingPassword) return;
    const val = this.passwordForm.value;
    if (val.newPassword !== val.confirmPassword) {
      this.passwordError = 'Les nouveaux mots de passe ne correspondent pas.';
      return;
    }
    const user = this.authService.getUser();
    if (!user) return;
    this.isSavingPassword = true;
    this.passwordSuccess = '';
    this.passwordError = '';
    this.authService.changePassword(user.id, val.oldPassword!, val.newPassword!).subscribe({
      next: () => {
        this.passwordSuccess = 'Mot de passe mis à jour avec succès.';
        this.passwordForm.reset();
        this.isSavingPassword = false;
      },
      error: () => { this.passwordError = 'Ancien mot de passe incorrect ou erreur serveur.'; this.isSavingPassword = false; },
    });
  }

  // ── Received reservations ────────────────────────────────────────────────
  loadMyTrips(): void {
    this.isLoadingTrips = true;
    this.tripService.getMyTrips().subscribe({
      next: (trips) => {
        this.myTrips = trips;
        if (trips.length === 0) { this.isLoadingTrips = false; return; }
        const requests = trips.map((t) => this.tripService.getTripBookings(t.id).pipe(catchError(() => of([]))));
        forkJoin(requests).subscribe((results) => {
          trips.forEach((t, i) => { this.tripBookingsMap[t.id] = results[i] as BookingResponse[]; });
          this.isLoadingTrips = false;
        });
      },
      error: () => { this.isLoadingTrips = false; },
    });
  }

  selectTrip(tripId: number): void {
    this.selectedTripId = tripId;
    this.bookingActionError = '';
    this.selectedTripBookings = this.tripBookingsMap[tripId] ?? [];
  }

  completeTrip(tripId: number): void {
    this.isCompletingTrip = true;
    this.bookingActionError = '';
    this.tripService.completeTrip(tripId).subscribe({
      next: (updatedTrip) => {
        const tripIndex = this.myTrips.findIndex((trip) => trip.id === updatedTrip.id);
        if (tripIndex >= 0) {
          this.myTrips[tripIndex] = updatedTrip;
        }
        this.isCompletingTrip = false;
      },
      error: (err: { error?: { message?: string } }) => {
        this.bookingActionError = err.error?.message || "Erreur lors du passage du trajet à l'état effectué.";
        this.isCompletingTrip = false;
      },
    });
  }

  acceptBooking(bookingId: number): void {
    if (!this.selectedTripId) return;
    this.bookingActionError = '';
    this.tripService.acceptBooking(this.selectedTripId, bookingId).subscribe({
      next: (updated) => {
        const idx = this.selectedTripBookings.findIndex((x) => x.id === updated.id);
        if (idx >= 0) { this.selectedTripBookings[idx] = updated; this.tripBookingsMap[this.selectedTripId!][idx] = updated; }
      },
      error: () => { this.bookingActionError = "Erreur lors de l'acceptation."; },
    });
  }

  rejectBooking(bookingId: number): void {
    if (!this.selectedTripId) return;
    this.bookingActionError = '';
    this.tripService.rejectBooking(this.selectedTripId, bookingId).subscribe({
      next: (updated) => {
        const idx = this.selectedTripBookings.findIndex((x) => x.id === updated.id);
        if (idx >= 0) { this.selectedTripBookings[idx] = updated; this.tripBookingsMap[this.selectedTripId!][idx] = updated; }
      },
      error: () => { this.bookingActionError = 'Erreur lors du refus.'; },
    });
  }

  removeBooking(bookingId: number): void {
    if (!this.selectedTripId) return;
    this.pendingRemoveBookingId = bookingId;
    this.isRemoveModalOpen = true;
  }

  confirmRemoveBooking(): void {
    if (!this.selectedTripId || this.pendingRemoveBookingId === null) return;
    this.isRemoving = true;
    this.bookingActionError = '';
    this.tripService.removeBooking(this.selectedTripId, this.pendingRemoveBookingId).subscribe({
      next: () => {
        this.selectedTripBookings = this.selectedTripBookings.filter(
          (b) => b.id !== this.pendingRemoveBookingId
        );
        this.tripBookingsMap[this.selectedTripId!] = this.selectedTripBookings;
        this.isRemoveModalOpen = false;
        this.pendingRemoveBookingId = null;
        this.isRemoving = false;
      },
      error: () => {
        this.bookingActionError = 'Erreur lors du retrait du demandeur.';
        this.isRemoveModalOpen = false;
        this.pendingRemoveBookingId = null;
        this.isRemoving = false;
      },
    });
  }

  cancelRemoveBooking(): void {
    this.isRemoveModalOpen = false;
    this.pendingRemoveBookingId = null;
  }

  confirmDelivery(booking: BookingResponse): void {
    if (!this.selectedTripId || this.validatingDeliveryBookingId !== null) return;

    const validationCode = (this.deliveryCodeByBookingId[booking.id] ?? '').trim();
    if (!/^\d{6}$/.test(validationCode)) {
      this.bookingActionError = 'Saisissez un code de validation à 6 chiffres.';
      return;
    }

    this.validatingDeliveryBookingId = booking.id;
    this.bookingActionError = '';
    this.tripService.confirmBookingDelivery(this.selectedTripId, booking.id, { validationCode }).subscribe({
      next: (updated) => {
        const idx = this.selectedTripBookings.findIndex((x) => x.id === updated.id);
        if (idx >= 0) {
          this.selectedTripBookings[idx] = updated;
          this.tripBookingsMap[this.selectedTripId!][idx] = updated;
        }
        const senderBookingIdx = this.myBookings.findIndex((x) => x.id === updated.id);
        if (senderBookingIdx >= 0) {
          this.myBookings[senderBookingIdx] = updated;
        }
        delete this.deliveryCodeByBookingId[booking.id];
        this.validatingDeliveryBookingId = null;
      },
      error: (err: { error?: { message?: string } }) => {
        this.bookingActionError = err.error?.message || 'Erreur lors de la validation de la remise.';
        this.validatingDeliveryBookingId = null;
      },
    });
  }

  cancelTrip(tripId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce trajet ? Tous les demandeurs seront notifiés.')) return;
    this.isCancellingTrip = true;
    this.bookingActionError = '';
    this.tripService.cancelTrip(tripId).subscribe({
      next: () => {
        this.myTrips = this.myTrips.filter((t) => t.id !== tripId);
        if (this.selectedTripId === tripId) {
          this.selectedTripId = null;
          this.selectedTripBookings = [];
        }
        this.isCancellingTrip = false;
      },
      error: () => { this.bookingActionError = "Erreur lors de l'annulation du trajet."; this.isCancellingTrip = false; },
    });
  }

  loadSentBookings(): void {
    this.isLoadingSentBookings = true;
    this.tripService.getMyBookings().subscribe({
      next: (b) => { this.myBookings = b; this.isLoadingSentBookings = false; },
      error: () => { this.isLoadingSentBookings = false; },
    });
  }

  cancelMyBooking(booking: BookingResponse): void {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;
    this.tripService.cancelBooking(booking.tripId, booking.id).subscribe({
      next: (updated) => {
        const idx = this.myBookings.findIndex((b) => b.id === updated.id);
        if (idx >= 0) { this.myBookings[idx] = updated; }
      },
      error: () => { /* no-op: UX handled by status staying unchanged */ },
    });
  }

  statusLabel(status: string): string {
    return ({ PENDING: 'En attente', ACCEPTED: 'Acceptée', REJECTED: 'Refusée', CANCELLED: 'Annulée', REMOVED: 'Retirée', DELIVERED: 'Remise confirmée' } as Record<string, string>)[status] ?? status;
  }

  statusClass(status: string): string {
    return ({ PENDING: 'bg-yellow-100 text-yellow-800', ACCEPTED: 'bg-green-100 text-green-800', REJECTED: 'bg-red-100 text-red-800', CANCELLED: 'bg-gray-100 text-gray-500', REMOVED: 'bg-slate-100 text-slate-600', DELIVERED: 'bg-secondary/10 text-secondary' } as Record<string, string>)[status] ?? 'bg-gray-100 text-gray-800';
  }

  validationChannelLabel(channel?: string): string {
    return channel === 'SMS' ? 'SMS' : 'e-mail';
  }

  tripStatusLabel(status: Trip['status']): string {
    return ({ ACTIVE: 'Actif', COMPLETED: 'Effectué', CANCELLED: 'Annulé' } as Record<Trip['status'], string>)[status];
  }

  tripStatusClass(status: Trip['status']): string {
    return ({ ACTIVE: 'bg-secondary/10 text-secondary', COMPLETED: 'bg-success/10 text-success', CANCELLED: 'bg-gray-100 text-gray-500' } as Record<Trip['status'], string>)[status];
  }

  selectedTrip(): Trip | undefined {
    return this.myTrips.find((trip) => trip.id === this.selectedTripId);
  }

  canValidateDelivery(booking: BookingResponse): boolean {
    return this.selectedTrip()?.status === 'COMPLETED'
      && booking.status === 'ACCEPTED'
      && booking.validationCodeActive;
  }
}
