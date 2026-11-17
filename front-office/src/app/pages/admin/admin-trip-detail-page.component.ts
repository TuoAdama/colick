import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, combineLatest, distinctUntilChanged, map, startWith, switchMap, tap } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { adminDate, statusLabel } from './admin-display';
import { AdminPaginationComponent } from './admin-pagination.component';
import { adminPageIndex, adminRequest } from './admin-request';
import { AdminTripCancellationComponent } from './admin-trip-cancellation.component';

@Component({
  standalone: true,
  imports: [RouterLink, AdminPaginationComponent, AdminTripCancellationComponent],
  templateUrl: './admin-trip-detail-page.component.html',
})
export class AdminTripDetailPageComponent {
  private readonly service = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly refreshTrip = new Subject<void>();
  private readonly refreshBookings = new Subject<void>();
  private readonly id$ = this.route.paramMap.pipe(map(params => Number(params.get('id'))), distinctUntilChanged());
  private readonly page$ = this.route.queryParamMap.pipe(map(params => adminPageIndex(params.get('page'))), distinctUntilChanged());
  readonly listPage = toSignal(this.route.queryParamMap.pipe(map(params => adminPageIndex(params.get('listPage')))),
    { initialValue: 0 });
  readonly date = adminDate;
  readonly status = statusLabel;
  readonly message = signal('');

  readonly detail = toSignal(this.id$.pipe(
    tap(() => this.message.set('')),
    switchMap(id => this.refreshTrip.pipe(
      startWith(undefined),
      switchMap(() => adminRequest(this.service.tripDetail(id), 'Impossible de charger le trajet.', 'Trajet introuvable.')),
    )),
  ), { initialValue: { state: 'loading' } });

  readonly bookings = toSignal(combineLatest([this.id$, this.page$]).pipe(
    switchMap(([id, page]) => this.refreshBookings.pipe(
      startWith(undefined),
      switchMap(() => adminRequest(this.service.tripBookings(id, page), 'Impossible de charger les réservations.')),
    )),
  ), { initialValue: { state: 'loading' } });

  changePage(page: number) {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page }, queryParamsHandling: 'merge' });
  }

  reloadTrip() { this.refreshTrip.next(); }
  reloadBookings() { this.refreshBookings.next(); }

  tripCancelled() {
    this.message.set('Le trajet a été annulé.');
    this.reloadTrip();
  }
}
