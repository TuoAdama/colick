import { Component, Input, Output, EventEmitter, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ReactiveFormsModule, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Trip } from '../../../models/trip.model';
import { BookingResponse, ParcelGuidelines } from '../../../models/booking.model';
import { TripService } from '../../../services/trip.service';

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function recipientContactValidator(control: AbstractControl): ValidationErrors | null {
  const value = `${control.value ?? ''}`.trim();
  if (!value) {
    return null;
  }

  const normalizedPhone = value.replace(/[\s().-]/g, '');
  if (EMAIL_PATTERN.test(value) || /^\+?[0-9]{6,15}$/.test(normalizedPhone)) {
    return null;
  }

  return { recipientContact: true };
}

/**
 * BookingModalComponent - Modal overlay for submitting a parcel booking request.
 */
@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-modal.component.html',
})
export class BookingModalComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly tripService = inject(TripService);

  @Input() trip: Trip | null = null;
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() bookingCreated = new EventEmitter<BookingResponse>();

  bookingForm = this.fb.group({
    title: ['', [Validators.required]],
    weight: [null as number | null, [Validators.required, Validators.min(0.1)]],
    description: [''],
    recipientContact: ['', [Validators.required, recipientContactValidator]],
    parcelPolicyAccepted: [false, [Validators.requiredTrue]],
  });

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  currentStep: 1 | 2 = 1;
  guidelines: ParcelGuidelines | null = null;
  guidelinesError = '';
  selectedPhoto: File | null = null;
  photoPreviewUrl: string | null = null;
  photoError = '';
  photoUploadFailed = false;
  private createdBooking: BookingResponse | null = null;
  private bookingWasEmitted = false;

  ngOnInit(): void {
    if (typeof this.tripService.getParcelGuidelines !== 'function') {
      this.guidelinesError = 'Les règles relatives aux colis sont indisponibles. Réessayez plus tard.';
      return;
    }
    this.tripService.getParcelGuidelines().subscribe({
      next: guidelines => this.guidelines = guidelines,
      error: () => this.guidelinesError = 'Les règles relatives aux colis sont indisponibles. Réessayez plus tard.',
    });
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  continueToPhoto(): void {
    const controls = this.bookingForm.controls;
    controls.title.markAsTouched();
    controls.weight.markAsTouched();
    controls.recipientContact.markAsTouched();
    if (controls.title.invalid || controls.weight.invalid || controls.recipientContact.invalid) return;
    this.currentStep = 2;
  }

  backToDetails(): void { this.currentStep = 1; }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.photoError = '';
    if (!file) return;
    const allowed = this.guidelines?.allowedPhotoContentTypes ?? ['image/jpeg', 'image/png', 'image/webp'];
    const maxBytes = this.guidelines?.maxPhotoBytes ?? 5 * 1024 * 1024;
    if (!allowed.includes(file.type)) {
      this.photoError = 'Choisissez une image JPEG, PNG ou WebP.';
      input.value = '';
      return;
    }
    if (file.size > maxBytes) {
      this.photoError = 'La photo ne doit pas dépasser 5 Mo.';
      input.value = '';
      return;
    }
    this.revokePreview();
    this.selectedPhoto = file;
    this.photoPreviewUrl = URL.createObjectURL(file);
  }

  removePhoto(): void {
    this.revokePreview();
    this.selectedPhoto = null;
    this.photoError = '';
  }

  close(): void {
    if (this.createdBooking && !this.bookingWasEmitted) this.emitCreated(this.createdBooking);
    this.closed.emit();
    this.errorMessage = '';
    this.successMessage = '';
    this.bookingForm.reset();
    this.bookingForm.controls.parcelPolicyAccepted.setValue(false);
    this.currentStep = 1;
    this.removePhoto();
    this.photoUploadFailed = false;
    this.createdBooking = null;
    this.bookingWasEmitted = false;
  }

  onSubmit(): void {
    if (!this.trip || this.bookingForm.invalid) return;

    const weight = this.bookingForm.value.weight!;
    if (weight > this.trip.availableWeight) {
      this.errorMessage = `Le poids ne doit pas dépasser ${this.trip.availableWeight} kg disponibles.`;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.tripService.createBooking(this.trip.id, {
      title: this.bookingForm.value.title!,
      weight,
      description: this.bookingForm.value.description || undefined,
      recipientContact: this.bookingForm.value.recipientContact!.trim(),
      parcelPolicyAccepted: this.bookingForm.value.parcelPolicyAccepted === true,
      parcelPolicyVersion: this.guidelines?.version ?? '',
    }).subscribe({
      next: (booking: BookingResponse) => {
        this.createdBooking = booking;
        if (this.selectedPhoto) {
          this.uploadPhoto(booking);
        } else {
          this.completeSuccess();
        }
      },
      error: (err: { error?: { message?: string } }) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de l\'envoi de la demande.';
      },
    });
  }

  retryPhotoUpload(): void {
    if (this.createdBooking && this.selectedPhoto) this.uploadPhoto(this.createdBooking);
  }

  private uploadPhoto(booking: BookingResponse): void {
    this.isLoading = true;
    this.photoUploadFailed = false;
    this.tripService.uploadBookingPhoto(booking.tripId, booking.id, this.selectedPhoto!).subscribe({
      next: updated => {
        this.createdBooking = updated;
        this.emitCreated(updated);
        this.completeSuccess();
      },
      error: () => {
        this.isLoading = false;
        this.photoUploadFailed = true;
        this.errorMessage = 'La demande est enregistrée, mais la photo n’a pas été envoyée. Vous pouvez réessayer.';
      },
    });
  }

  private completeSuccess(): void {
    if (this.createdBooking) this.emitCreated(this.createdBooking);
    this.isLoading = false;
    this.errorMessage = '';
    this.successMessage = 'Demande envoyée avec succès !';
    setTimeout(() => this.close(), 2000);
  }

  private emitCreated(booking: BookingResponse): void {
    if (this.bookingWasEmitted) return;
    this.bookingWasEmitted = true;
    this.bookingCreated.emit(booking);
  }

  private revokePreview(): void {
    if (this.photoPreviewUrl) URL.revokeObjectURL(this.photoPreviewUrl);
    this.photoPreviewUrl = null;
  }
}
