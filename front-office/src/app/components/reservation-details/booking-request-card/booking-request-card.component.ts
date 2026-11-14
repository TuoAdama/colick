import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BookingResponse } from '../../../models/booking.model';
import { Trip } from '../../../models/trip.model';

@Component({
  selector: 'app-booking-request-card',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block',
  },
  templateUrl: './booking-request-card.component.html',
  styleUrl: './booking-request-card.component.css',
})
export class BookingRequestCardComponent {
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  @ViewChild('optionsButton') private optionsButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('cancelButton') private cancelButton?: ElementRef<HTMLButtonElement>;

  @Input({ required: true }) booking!: BookingResponse;
  @Input({ required: true }) tripStatus!: Trip['status'];
  @Input() isProcessing = false;
  @Input() destination = '';

  isOptionsOpen = false;
  @Input({ required: true }) tripId!: number;
  @Input() pricePerKilo: number | null = null;

  @Output() accept = new EventEmitter<number>();
  @Output() reject = new EventEmitter<number>();
  @Output() remove = new EventEmitter<number>();
  @Output() message = new EventEmitter<number>();
  @Output() confirmDelivery = new EventEmitter<{ bookingId: number; code: string }>();

  deliveryCode = '';
  private senderPhotoLoadFailed = false;
  private lastSenderPhotoUrl: string | null = null;

  statusLabel(status: BookingResponse['status']): string {
    return ({
      PENDING: 'En attente',
      ACCEPTED: 'Acceptée',
      REJECTED: 'Refusée',
      CANCELLED: 'Annulée',
      REMOVED: 'Retirée',
    } as Record<BookingResponse['status'], string>)[status];
  }

  /**
   * Returns Tailwind classes for the compact status badge in the card header.
   * Maps each status to a pill-shaped badge matching the mockup palette.
   */
  statusBadgeClass(status: BookingResponse['status']): string {
    return ({
      PENDING: 'bg-border text-text-secondary',
      ACCEPTED: 'bg-secondary/10 text-secondary',
      REJECTED: 'bg-error/10 text-error',
      CANCELLED: 'bg-error/10 text-error',
      REMOVED: 'bg-background-primary text-text-muted',
    } as Record<BookingResponse['status'], string>)[status];
  }

  senderInitial(): string {
    return this.booking.senderName?.trim().charAt(0).toUpperCase() || '?';
  }

  senderPhotoUrl(): string | null {
    const photoUrl = this.booking.senderPhotoUrl?.trim() ?? null;
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

  validationChannelLabel(channel?: BookingResponse['validationDeliveryChannel']): string {
    return channel === 'SMS' ? 'SMS' : 'e-mail';
  }

  reservationAmount(): number | null {
    if (
      this.pricePerKilo === null
      || this.pricePerKilo === undefined
      || Number.isNaN(this.pricePerKilo)
      || Number.isNaN(this.booking.weight)
    ) {
      return null;
    }

    return this.booking.weight * this.pricePerKilo;
  }

  canShowConfirmDelivery(): boolean {
    return this.tripStatus === 'COMPLETED'
      && this.booking.status === 'ACCEPTED'
      && this.booking.validationCodeActive
      && !this.booking.deliveredAt;
  }

  goToDetails(): void {
    if (this.isProcessing) {
      return;
    }

    void this.router.navigate(['/trips', this.tripId, 'reservations', this.booking.id]);
  }

  onAccept(): void {
    if (this.isProcessing) {
      return;
    }

    this.accept.emit(this.booking.id);
  }

  onReject(): void {
    if (this.isProcessing) {
      return;
    }

    this.reject.emit(this.booking.id);
  }

  toggleOptions(): void {
    if (this.isProcessing) {
      return;
    }
    this.isOptionsOpen = !this.isOptionsOpen;
  }

  focusCancel(event: Event): void {
    event.preventDefault();
    this.isOptionsOpen = true;
    // Wait for Angular to render the action before moving keyboard focus.
    setTimeout(() => this.cancelButton?.nativeElement.focus());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOptionsOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  closeOptions(): void {
    if (this.isOptionsOpen) {
      this.isOptionsOpen = false;
      this.optionsButton?.nativeElement.focus();
    }
  }

  @HostListener('focusout', ['$event'])
  onFocusOut(event: FocusEvent): void {
    if (!this.elementRef.nativeElement.contains(event.relatedTarget as Node)) {
      this.isOptionsOpen = false;
    }
  }

  onRemove(): void {
    if (this.isProcessing) {
      return;
    }

    this.closeOptions();
    this.remove.emit(this.booking.id);
  }

  onMessage(): void {
    if (this.isProcessing) {
      return;
    }

    this.message.emit(this.booking.id);
  }

  onConfirmDelivery(): void {
    if (this.isProcessing) {
      return;
    }

    const code = this.deliveryCode.trim();
    if (!/^\d{6}$/.test(code)) {
      return;
    }

    this.confirmDelivery.emit({ bookingId: this.booking.id, code });
  }
}
