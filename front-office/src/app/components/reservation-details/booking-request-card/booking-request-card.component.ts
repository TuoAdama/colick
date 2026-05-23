import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BookingResponse } from '../../../models/booking.model';
import { Trip } from '../../../models/trip.model';

@Component({
  selector: 'app-booking-request-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-request-card.component.html',
})
export class BookingRequestCardComponent {
  @Input({ required: true }) booking!: BookingResponse;
  @Input({ required: true }) tripStatus!: Trip['status'];
  @Input() isProcessing = false;
  @Input({ required: true }) tripId!: number;
  @Input() pricePerKilo: number | null = null;

  @Output() accept = new EventEmitter<number>();
  @Output() reject = new EventEmitter<number>();
  @Output() remove = new EventEmitter<number>();
  @Output() message = new EventEmitter<number>();
  @Output() confirmDelivery = new EventEmitter<{ bookingId: number; code: string }>();

  deliveryCode = '';

  statusLabel(status: BookingResponse['status']): string {
    return ({
      PENDING: 'En attente',
      ACCEPTED: 'Acceptée',
      REJECTED: 'Refusée',
      CANCELLED: 'Annulée',
      REMOVED: 'Retirée',
    } as Record<BookingResponse['status'], string>)[status];
  }

  statusClass(status: BookingResponse['status']): string {
    return ({
      PENDING: 'border-warning/20 bg-warning/10 text-warning',
      ACCEPTED: 'border-success/20 bg-success/10 text-success',
      REJECTED: 'border-error/20 bg-error/10 text-error',
      CANCELLED: 'border-error/20 bg-error/10 text-error',
      REMOVED: 'border-text-muted/20 bg-background-primary text-text-muted',
    } as Record<BookingResponse['status'], string>)[status];
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

  onRemove(): void {
    if (this.isProcessing) {
      return;
    }

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
