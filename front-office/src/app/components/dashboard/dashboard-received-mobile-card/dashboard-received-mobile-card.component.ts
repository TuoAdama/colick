import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Trip } from '../../../models/trip.model';
import { TripOptionsMenuComponent } from '../trip-options-menu/trip-options-menu.component';

@Component({
  selector: 'app-dashboard-received-mobile-card',
  standalone: true,
  imports: [CommonModule, TripOptionsMenuComponent],
  templateUrl: './dashboard-received-mobile-card.component.html',
})
export class DashboardReceivedMobileCardComponent {
  @Input({ required: true }) trip!: Trip;
  @Input() bookingCount = 0;
  @Input() isSelected = false;
  @Input() isGeneratingShareCard = false;
  @Input() isCompletingTrip = false;

  @Output() viewTrip = new EventEmitter<number>();
  @Output() editTrip = new EventEmitter<number>();
  @Output() downloadShareCard = new EventEmitter<number>();
  @Output() markTripCompleted = new EventEmitter<number>();
  @Output() cancelTrip = new EventEmitter<number>();

  statusLabel(status: Trip['status']): string {
    return ({
      ACTIVE: 'Actif',
      COMPLETED: 'Terminé',
      CANCELLED: 'Annulé',
    } as Record<Trip['status'], string>)[status];
  }

  statusClass(status: Trip['status']): string {
    return ({
      ACTIVE: 'border-success/25 bg-success/10 text-success',
      COMPLETED: 'border-secondary/20 bg-secondary/10 text-secondary',
      CANCELLED: 'border-bg-primary bg-bg-primary text-text-muted',
    } as Record<Trip['status'], string>)[status];
  }

  bookingCountLabel(): string {
    return this.bookingCount === 1 ? `${this.bookingCount} demande` : `${this.bookingCount} demandes`;
  }

  primaryLocationLabel(value: string): string {
    const [firstSegment] = value.split(',');
    return firstSegment.trim() || value.trim();
  }

  departureDateTimeLabel(): string {
    const departureDate = new Date(this.trip.departureTime);

    if (Number.isNaN(departureDate.getTime())) {
      return 'Date indisponible';
    }

    const formattedDate = departureDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const formattedTime = departureDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${formattedDate.charAt(0).toUpperCase()}${formattedDate.slice(1)} • ${formattedTime}`;
  }

  availableWeightLabel(): string {
    const availableWeight = this.resolveAvailableWeight();

    if (availableWeight === null) {
      return 'Capacité indisponible';
    }

    return `${new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(availableWeight)} kg disponibles`;
  }

  onViewTrip(): void {
    this.viewTrip.emit(this.trip.id);
  }

  onEditTrip(): void {
    if (this.trip.status !== 'ACTIVE') {
      return;
    }

    this.editTrip.emit(this.trip.id);
  }

  private resolveAvailableWeight(): number | null {
    if (this.isValidNumber(this.trip.availableWeight)) {
      return this.trip.availableWeight;
    }

    if (this.isValidNumber(this.trip.maxWeight)) {
      return this.trip.maxWeight;
    }

    return null;
  }

  private isValidNumber(value?: number | null): value is number {
    return value !== null && value !== undefined && !Number.isNaN(value);
  }
}
