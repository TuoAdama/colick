import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminTrip } from '../../models/admin.model';
import { AdminService } from '../../services/admin.service';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-admin-trip-cancellation',
  standalone: true,
  imports: [ConfirmModalComponent],
  template: `
    <button type="button" class="font-semibold text-error underline" (click)="open.set(true)">
      Annuler le trajet
    </button>
    <app-confirm-modal
      [isOpen]="open()" [title]="'Annuler le trajet ' + trip().reference + ' ?'"
      message="Le trajet sera retiré du catalogue. Les expéditeurs ayant une réservation en attente ou acceptée seront avertis. Le trajet et ses réservations resteront consultables dans l’historique."
      confirmLabel="Confirmer l’annulation" [isLoading]="busy()" [errorMessage]="error()"
      (confirmed)="confirm()" (cancelled)="dismiss()" />
  `,
})
export class AdminTripCancellationComponent {
  private readonly service = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);
  readonly trip = input.required<AdminTrip>();
  readonly cancelled = output<void>();
  readonly refresh = output<void>();
  readonly open = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  private stale = false;

  dismiss() {
    if (this.busy()) return;
    this.open.set(false);
    this.error.set('');
    if (this.stale) this.refresh.emit();
    this.stale = false;
  }

  confirm() {
    if (this.busy() || this.stale) return;
    this.busy.set(true);
    this.error.set('');
    this.service.cancelTrip(this.trip().id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busy.set(false);
        this.open.set(false);
        this.cancelled.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.busy.set(false);
        this.stale = error.status === 409 || error.status === 404;
        this.error.set(this.stale
          ? 'Ce trajet ne peut plus être annulé. Fermez cette fenêtre pour actualiser son statut.'
          : 'Impossible d’annuler le trajet. Réessayez.');
      },
    });
  }
}
