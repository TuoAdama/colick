import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BookingResponse } from '../../../models/booking.model';
import { Trip } from '../../../models/trip.model';
import { TripOptionsMenuComponent } from '../trip-options-menu/trip-options-menu.component';

@Component({
  selector: 'app-traveler-trips-desktop-list',
  standalone: true,
  imports: [CommonModule, TripOptionsMenuComponent],
  templateUrl: './traveler-trips-desktop-list.component.html',
})
export class TravelerTripsDesktopListComponent {
  @Input({ required: true }) trips: Trip[] = [];
  @Input({ required: true }) tripBookingsMap: Record<number, BookingResponse[]> = {};
  @Input() selectedTripId: number | null = null;
  @Input() generatingShareCardTripId: number | null = null;
  @Input() completingTripId: number | null = null;

  @Output() selectTrip = new EventEmitter<number>();
  @Output() downloadTripShareCard = new EventEmitter<number>();
  @Output() markTripCompleted = new EventEmitter<number>();

  bookingCount(tripId: number): number {
    return this.tripBookingsMap[tripId]?.length ?? 0;
  }

  onSelect(tripId: number): void {
    this.selectTrip.emit(tripId);
  }

  onRowKeydown(event: KeyboardEvent, tripId: number): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.onSelect(tripId);
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
      ACTIVE: 'bg-accent/10 text-accent',
      COMPLETED: 'bg-success/10 text-success',
      CANCELLED: 'bg-background-primary text-text-muted',
    } as Record<Trip['status'], string>)[status];
  }
}
