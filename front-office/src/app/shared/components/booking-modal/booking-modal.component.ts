import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ReactiveFormsModule, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Trip } from '../../../models/trip.model';
import { BookingResponse } from '../../../models/booking.model';
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
export class BookingModalComponent {
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
  });

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  close(): void {
    this.closed.emit();
    this.errorMessage = '';
    this.successMessage = '';
    this.bookingForm.reset();
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
    }).subscribe({
      next: (booking: BookingResponse) => {
        this.isLoading = false;
        this.successMessage = 'Demande envoyée avec succès !';
        this.bookingCreated.emit(booking);
        setTimeout(() => this.close(), 2000);
      },
      error: (err: { error?: { message?: string } }) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de l\'envoi de la demande.';
      },
    });
  }
}
