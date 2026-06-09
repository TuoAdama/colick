import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Generic confirmation modal.
 * Emits `confirmed` when the user clicks the confirm button,
 * `cancelled` when they dismiss or click cancel.
 */
@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirmer l\'action';
  @Input() message = 'Êtes-vous sûr de vouloir effectuer cette action ?';
  @Input() confirmLabel = 'Confirmer';
  /** 'danger' renders the confirm button in error red, 'primary' in navy */
  @Input() variant: 'danger' | 'primary' = 'danger';
  @Input() isLoading = false;
  /** Optional error message displayed inside the modal body. */
  @Input() errorMessage = '';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  get confirmButtonClass(): string {
    return this.variant === 'danger'
      ? 'bg-error hover:bg-red-600'
      : 'bg-primary hover:bg-opacity-90';
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
