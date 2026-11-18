import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, distinctUntilChanged, map, startWith, switchMap } from 'rxjs';
import { AdminTripSort } from '../../models/admin.model';
import { AdminService } from '../../services/admin.service';
import { adminDate, statusLabel } from './admin-display';
import { AdminPaginationComponent } from './admin-pagination.component';
import { adminPageIndex, adminRequest, adminTripSortParam } from './admin-request';
import { AdminTripCancellationComponent } from './admin-trip-cancellation.component';

@Component({
  standalone: true,
  imports: [RouterLink, AdminPaginationComponent, AdminTripCancellationComponent],
  templateUrl: './admin-trips-page.component.html',
})
export class AdminTripsPageComponent {
  private readonly service = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly refresh = new Subject<void>();
  private readonly criteria$ = this.route.queryParamMap.pipe(
    map(params => ({ page: adminPageIndex(params.get('page')), sort: adminTripSortParam(params.get('sort')) })),
    distinctUntilChanged((previous, current) => previous.page === current.page && previous.sort === current.sort),
  );
  readonly message = signal('');
  readonly date = adminDate;
  readonly status = statusLabel;
  readonly sort = toSignal(this.criteria$.pipe(map(criteria => criteria.sort)), { initialValue: null });

  readonly trips = toSignal(this.criteria$.pipe(
    switchMap(({ page, sort }) => this.refresh.pipe(
      startWith(undefined),
      switchMap(() => adminRequest(this.service.publishedTrips(page, sort ?? 'created_desc'), 'Impossible de charger les trajets.')),
    )),
  ), { initialValue: { state: 'loading' } });

  changePage(page: number) {
    this.navigate(page, this.sort());
  }

  toggleSort() {
    this.navigate(0, this.sort() === 'created_asc' ? null : 'created_asc');
  }

  private navigate(page: number, sort: AdminTripSort | null) {
    this.message.set('');
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page, sort } });
  }

  reload() { this.refresh.next(); }

  tripCancelled(reference: string) {
    this.message.set(`Le trajet ${reference} a été annulé.`);
    this.reload();
  }
}
