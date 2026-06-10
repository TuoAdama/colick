import { ChangeDetectorRef, Component, ElementRef, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as htmlToImage from 'html-to-image';
import { AuthService } from '../../services/auth.service';
import { ShareCardData } from '../../models/share-card.model';
import { TripService } from '../../services/trip.service';
import { Trip } from '../../models/trip.model';
import { BookingResponse } from '../../models/booking.model';
import { ShareCardMapperService } from '../../services/share-card-mapper.service';
import { ShareCardStoryComponent } from '../../components/share-card-story/share-card-story.component';
import { TravelerTripsDesktopListComponent } from '../../components/dashboard/traveler-trips-desktop-list/traveler-trips-desktop-list.component';
import { DashboardReceivedMobileCardComponent } from '../../components/dashboard/dashboard-received-mobile-card/dashboard-received-mobile-card.component';

@Component({
  selector: 'app-received-bookings-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ShareCardStoryComponent,
    TravelerTripsDesktopListComponent,
    DashboardReceivedMobileCardComponent,
  ],
  templateUrl: './received-bookings-page.component.html',
})
export class ReceivedBookingsPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly shareCardMapperService = inject(ShareCardMapperService);
  private readonly tripService = inject(TripService);
  private readonly router = inject(Router);
  @ViewChild('shareCardCapture') private shareCardCapture?: ElementRef<HTMLElement>;

  // ── Received reservations ─────────────────────────────────────────────────
  myTrips: Trip[] = [];
  tripBookingsMap: Record<number, BookingResponse[]> = {};
  isLoadingTrips = false;
  receivedTripsActionError = '';
  isCancellingTrip = false;
  isDeletingTrip = false;
  isCompletingTrip = false;
  completingTripId: number | null = null;
  isGeneratingShareCard = false;
  generatingShareCardTripId: number | null = null;
  shareCardError = '';
  shareCardData: ShareCardData | null = null;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadMyTrips();
  }

  loadMyTrips(): void {
    this.isLoadingTrips = true;
    this.receivedTripsActionError = '';
    this.tripService.getMyTrips().subscribe({
      next: (trips) => {
        this.myTrips = trips;
        if (trips.length === 0) { this.isLoadingTrips = false; return; }
        const requests = trips.map((t) => this.tripService.getTripBookings(t.id).pipe(catchError(() => of([]))));
        forkJoin(requests).subscribe((results) => {
          trips.forEach((t, i) => {
            this.tripBookingsMap[t.id] = (results[i] as BookingResponse[]).sort((a, b) =>
              new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
            );
          });
          this.isLoadingTrips = false;
        });
      },
      error: () => { this.isLoadingTrips = false; },
    });
  }

  selectTrip(tripId: number): void {
    void this.router.navigate(['/trips', tripId, 'reservations']);
  }

  async downloadShareCardPng(tripId?: number): Promise<void> {
    const trip = typeof tripId === 'number'
      ? this.myTrips.find((currentTrip) => currentTrip.id === tripId)
      : undefined;
    const user = this.authService.getUser();

    if (!trip || trip.status !== 'ACTIVE' || !user) {
      this.shareCardError = 'Sélectionnez un voyage actif pour générer la carte.';
      return;
    }

    this.shareCardError = '';
    this.shareCardData = this.shareCardMapperService.mapActiveTripToShareCard(trip, user);
    this.cdr.detectChanges();
    this.isGeneratingShareCard = true;
    this.generatingShareCardTripId = trip.id;

    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

      const captureElement = this.shareCardCapture?.nativeElement;
      if (!captureElement) {
        throw new Error('Share card capture element missing');
      }

      const pngDataUrl = await this.generatePngFromElement(captureElement);

      const downloadLink = document.createElement('a');
      downloadLink.href = pngDataUrl;
      downloadLink.download = `colick-carte-partage-${this.shareCardMapperService.buildFileDate(trip.departureTime)}.png`;
      downloadLink.click();
    } catch {
      this.shareCardError = 'Impossible de générer la carte PNG pour le moment.';
    } finally {
      this.isGeneratingShareCard = false;
      this.generatingShareCardTripId = null;
    }
  }

  editTrip(tripId: number): void {
    void this.router.navigate(['/propose', tripId]);
  }

  completeTrip(tripId: number): void {
    if (this.isCompletingTrip) {
      return;
    }

    this.isCompletingTrip = true;
    this.completingTripId = tripId;
    this.receivedTripsActionError = '';
    this.tripService.completeTrip(tripId).subscribe({
      next: (updatedTrip) => {
        const tripIndex = this.myTrips.findIndex((trip) => trip.id === updatedTrip.id);
        if (tripIndex >= 0) {
          this.myTrips[tripIndex] = updatedTrip;
        }
        this.isCompletingTrip = false;
        this.completingTripId = null;
      },
      error: (err: { error?: { message?: string } }) => {
        this.receivedTripsActionError = err.error?.message || "Erreur lors du passage du trajet à l'état effectué.";
        this.isCompletingTrip = false;
        this.completingTripId = null;
      },
    });
  }

  handleDesktopTripShareCardDownload(tripId: number): void {
    void this.downloadShareCardPng(tripId);
  }

  handleDesktopTripCompletion(tripId: number): void {
    this.completeTrip(tripId);
  }

  handleDesktopTripEdit(tripId: number): void {
    this.editTrip(tripId);
  }

  handleDesktopTripDelete(tripId: number): void {
    this.deleteTrip(tripId);
  }

  handleDesktopTripCancel(tripId: number): void {
    this.cancelTrip(tripId);
  }

  deleteTrip(tripId: number): void {
    if ((this.tripBookingsMap[tripId] ?? []).length > 0) {
      this.receivedTripsActionError = 'Ce trajet ne peut pas être supprimé car il a déjà reçu des demandes.';
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce trajet ?')) return;
    this.isDeletingTrip = true;
    this.receivedTripsActionError = '';
    this.tripService.cancelTrip(tripId).subscribe({
      next: () => {
        this.removeTripFromState(tripId);
        this.isDeletingTrip = false;
      },
      error: () => {
        this.receivedTripsActionError = 'Erreur lors de la suppression du trajet.';
        this.isDeletingTrip = false;
      },
    });
  }

  cancelTrip(tripId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce trajet ? Tous les demandeurs seront notifiés.')) return;
    this.isCancellingTrip = true;
    this.receivedTripsActionError = '';
    this.tripService.cancelTrip(tripId).subscribe({
      next: () => {
        this.removeTripFromState(tripId);
        this.isCancellingTrip = false;
      },
      error: () => { this.receivedTripsActionError = "Erreur lors de l'annulation du trajet."; this.isCancellingTrip = false; },
    });
  }

  tripStatusLabel(status: Trip['status']): string {
    return ({ ACTIVE: 'Actif', COMPLETED: 'Terminé', CANCELLED: 'Annulé' } as Record<Trip['status'], string>)[status];
  }

  tripStatusClass(status: Trip['status']): string {
    return ({ ACTIVE: 'bg-accent/10 text-accent', COMPLETED: 'bg-success/10 text-success', CANCELLED: 'bg-background-primary text-text-muted' } as Record<Trip['status'], string>)[status];
  }

  private generatePngFromElement(element: HTMLElement): Promise<string> {
    return htmlToImage.toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
    });
  }

  private removeTripFromState(tripId: number): void {
    this.myTrips = this.myTrips.filter((trip) => trip.id !== tripId);
    delete this.tripBookingsMap[tripId];
  }
}
