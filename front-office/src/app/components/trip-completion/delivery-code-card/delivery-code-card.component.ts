import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BookingResponse } from '../../../models/booking.model';

@Component({
  selector: 'app-delivery-code-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delivery-code-card.component.html',
})
export class DeliveryCodeCardComponent {
  @Input({ required: true }) booking!: BookingResponse;
  @Input() codeValue = '';
  @Input() isSubmitting = false;

  @Output() codeChange = new EventEmitter<string>();
  @Output() validate = new EventEmitter<void>();

  senderInitials(): string {
    const parts = this.booking.senderName?.trim().split(/\s+/).filter(Boolean) ?? [];
    const first = parts[0]?.charAt(0) ?? '';
    const second = parts.length > 1 ? parts[1].charAt(0) : '';
    const initials = `${first}${second}`.toUpperCase();
    return initials || '?';
  }

  isValidated(): boolean {
    return !!this.booking.deliveredAt;
  }

  onCodeInput(value: string): void {
    this.codeChange.emit(value.replace(/\D/g, '').slice(0, 6));
  }
}
