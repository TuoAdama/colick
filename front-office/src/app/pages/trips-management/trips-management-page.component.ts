import { ChangeDetectorRef, Component, ElementRef, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as htmlToImage from 'html-to-image';
import { TripService } from '../../services/trip.service';
import { AuthService } from '../../services/auth.service';
import { Trip } from '../../models/trip.model';
import { BookingResponse } from '../../models/booking.model';
import { ShareCardData } from '../../models/share-card.model';
import { ShareCardMapperService } from '../../services/share-card-mapper.service';
import { ShareCardStoryComponent } from '../../components/share-card-story/share-card-story.component';
import { TripOptionsMenuComponent } from '../../components/dashboard/trip-options-menu/trip-options-menu.component';

/** Status filter tabs for the trip list. */
export type TripStatusFilter = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

@Component({
  selector: 'app-trips-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ShareCardStoryComponent, TripOptionsMenuComponent],
  templateUrl: './trips-management-page.component.html',
})
export class TripsManagementPageComponent implements OnInit {
  private readonly tripService = inject(TripService);
  private readonly authService = inject(AuthService);
  private readonly shareCardMapperService = inject(ShareCardMapperService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  @ViewChild('shareCardCapture') private shareCardCapture?: ElementRef<HTMLElement>;

  // ── Data ──────────────────────────────────────────────────────────────────
  trips: Trip[] = [];
  tripBookingsMap: Record<number, BookingResponse[]> = {};
  isLoading = false;
  loadError = '';
  creationSuccessMessage = '';

  // ── Filters ───────────────────────────────────────────────────────────────
  activeFilter: TripStatusFilter = 'ALL';
  searchQuery = '';

  /** Filter tab definitions. */
  filterTabs: { id: TripStatusFilter; label: string }[] = [
    { id: 'ALL', label: 'Tous les trajets' },
    { id: 'ACTIVE', label: 'Actifs' },
    { id: 'COMPLETED', label: 'Terminés' },
    { id: 'CANCELLED', label: 'Annulés' },
  ];

  // ── Pagination ────────────────────────────────────────────────────────────
  currentPage = 1;
  itemsPerPage = 5;

  // ── Share card generation ─────────────────────────────────────────────────
  generatingShareCardTripId: number | null = null;
  shareCardData: ShareCardData | null = null;

  // ── Trip completion ───────────────────────────────────────────────────────
  completingTripId: number | null = null;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.consumeCreationSuccessFlag();
    this.loadTrips();
  }

  private consumeCreationSuccessFlag(): void {
    if (this.route.snapshot.queryParamMap.get('created') !== '1') {
      return;
    }

    this.creationSuccessMessage = 'Votre trajet a été créé avec succès.';
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { created: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** Load all trips belonging to the current user along with their bookings. */
  loadTrips(): void {
    this.isLoading = true;
    this.loadError = '';
    this.tripService.getMyTrips().subscribe({
      next: (trips) => {
        this.trips = trips;
        if (trips.length === 0) {
          this.isLoading = false;
          return;
        }
        const requests = trips.map((t) =>
          this.tripService.getTripBookings(t.id).pipe(catchError(() => of([] as BookingResponse[])))
        );
        forkJoin(requests).subscribe((results) => {
          trips.forEach((t, i) => {
            this.tripBookingsMap[t.id] = results[i] as BookingResponse[];
          });
          this.isLoading = false;
        });
      },
      error: () => {
        this.loadError = 'Impossible de charger vos trajets.';
        this.isLoading = false;
      },
    });
  }

  // ── Computed filtered & paginated list ────────────────────────────────────

  /** Get trips filtered by status and search query. */
  get filteredTrips(): Trip[] {
    let result = this.trips;

    // Filter by status
    if (this.activeFilter !== 'ALL') {
      result = result.filter((t) => t.status === this.activeFilter);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.departureAddress.toLowerCase().includes(query) ||
          t.destination.toLowerCase().includes(query)
      );
    }

    return result;
  }

  /** Get the paginated subset of filtered trips for the current page. */
  get paginatedTrips(): Trip[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredTrips.slice(start, start + this.itemsPerPage);
  }

  /** Total number of pages based on filtered results. */
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTrips.length / this.itemsPerPage));
  }

  /** Array of page numbers for the paginator. */
  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // ── Filter actions ────────────────────────────────────────────────────────

  setFilter(filter: TripStatusFilter): void {
    this.activeFilter = filter;
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // ── Trip actions ──────────────────────────────────────────────────────────

  /** Navigate to trip bookings/details. */
  viewTripDetails(tripId: number): void {
    void this.router.navigate(['/trips', tripId, 'reservations']);
  }

  /** Navigate to edit a trip. */
  editTrip(tripId: number): void {
    void this.router.navigate(['/propose', tripId]);
  }

  /** Get the total number of bookings received for a given trip. */
  totalBookingCount(tripId: number): number {
    return this.tripBookingsMap[tripId]?.length ?? 0;
  }

  /** Get the number of pending bookings for a given trip. */
  pendingBookingCount(tripId: number): number {
    const bookings = this.tripBookingsMap[tripId] ?? [];
    return bookings.filter((b) => b.status === 'PENDING').length;
  }

  /** Mark a trip as completed. */
  markTripCompleted(tripId: number): void {
    if (this.completingTripId !== null) return;
    this.completingTripId = tripId;
    this.tripService.completeTrip(tripId).subscribe({
      next: (updatedTrip) => {
        const idx = this.trips.findIndex((t) => t.id === updatedTrip.id);
        if (idx >= 0) this.trips[idx] = updatedTrip;
        this.completingTripId = null;
      },
      error: () => {
        this.completingTripId = null;
      },
    });
  }

  /** Download the share card PNG for a trip. */
  async downloadShareCardPng(tripId: number): Promise<void> {
    const trip = this.trips.find((t) => t.id === tripId);
    const user = this.authService.getUser();
    if (!trip || trip.status !== 'ACTIVE' || !user) return;

    this.shareCardData = this.shareCardMapperService.mapActiveTripToShareCard(trip, user);
    this.cdr.detectChanges();
    this.generatingShareCardTripId = tripId;

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const captureElement = this.shareCardCapture?.nativeElement;
      if (!captureElement) throw new Error('Share card capture element missing');

      const pngDataUrl = await htmlToImage.toPng(captureElement, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const downloadLink = document.createElement('a');
      downloadLink.href = pngDataUrl;
      downloadLink.download = `colick-carte-partage-${this.shareCardMapperService.buildFileDate(trip.departureTime)}.png`;
      downloadLink.click();
    } catch {
      // Silent fail for PNG generation
    } finally {
      this.generatingShareCardTripId = null;
    }
  }

  // ── Status display helpers ────────────────────────────────────────────────

  tripStatusLabel(status: Trip['status']): string {
    return ({ ACTIVE: 'Actif', COMPLETED: 'Terminé', CANCELLED: 'Annulé' } as Record<Trip['status'], string>)[status];
  }

  tripStatusDotClass(status: Trip['status']): string {
    return ({
      ACTIVE: 'bg-accent',
      COMPLETED: 'bg-success',
      CANCELLED: 'bg-text-muted',
    } as Record<Trip['status'], string>)[status];
  }

  tripStatusTextClass(status: Trip['status']): string {
    return ({
      ACTIVE: 'text-accent',
      COMPLETED: 'text-success',
      CANCELLED: 'text-text-muted',
    } as Record<Trip['status'], string>)[status];
  }

  /** Format a date string into "DD Mois YYYY • HH:MM". */
  formatTripDate(dateStr: string): string {
    const date = new Date(dateStr);
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} • ${hours}:${minutes}`;
  }
}
