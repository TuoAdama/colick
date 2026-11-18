import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, distinctUntilChanged, map, startWith, switchMap, tap } from 'rxjs';
import { AdminTripSort } from '../../models/admin.model';
import { AdminService } from '../../services/admin.service';
import { adminDate, statusLabel } from './admin-display';
import { AdminPaginationComponent } from './admin-pagination.component';
import { adminPageIndex, adminRequest, adminTripSortParam } from './admin-request';
import { AdminTripCancellationComponent } from './admin-trip-cancellation.component';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, AdminPaginationComponent, AdminTripCancellationComponent],
  templateUrl: './admin-trips-page.component.html',
})
export class AdminTripsPageComponent {
  private readonly service = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly refresh = new Subject<void>();
  createdFromInput = '';
  queryInput = '';
  private readonly criteria$ = this.route.queryParamMap.pipe(
    map(params => ({
      page: adminPageIndex(params.get('page')), sort: adminTripSortParam(params.get('sort')),
      createdFrom: params.get('createdFrom') || null, q: params.get('q')?.trim() || null,
    })),
    distinctUntilChanged((previous, current) => previous.page === current.page && previous.sort === current.sort
      && previous.createdFrom === current.createdFrom && previous.q === current.q),
  );
  readonly message = signal('');
  readonly date = adminDate;
  readonly status = statusLabel;
  readonly criteria = toSignal(this.criteria$.pipe(tap(({ createdFrom, q }) => {
    this.createdFromInput = createdFrom ?? '';
    this.queryInput = q ?? '';
  })), { requireSync: true });

  readonly trips = toSignal(this.criteria$.pipe(
    switchMap(({ page, sort, createdFrom, q }) => this.refresh.pipe(
      startWith(undefined),
      switchMap(() => adminRequest(
        this.service.publishedTrips(page, sort ?? 'created_desc', createdFrom, q), 'Impossible de charger les trajets.',
      )),
    )),
  ), { initialValue: { state: 'loading' } });

  changePage(page: number) {
    this.navigate(page, this.criteria().sort);
  }

  toggleSort() {
    this.navigate(0, this.criteria().sort === 'created_asc' ? null : 'created_asc');
  }

  applyFilters() {
    this.queryInput = this.queryInput.trim();
    this.navigate(0, this.criteria().sort, this.createdFromInput || null, this.queryInput || null);
  }

  resetFilters() {
    this.createdFromInput = '';
    this.queryInput = '';
    this.applyFilters();
  }

  private navigate(page: number, sort: AdminTripSort | null,
                   createdFrom = this.criteria().createdFrom, q = this.criteria().q) {
    this.message.set('');
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page, sort, createdFrom, q } });
  }

  reload() { this.refresh.next(); }

  tripCancelled(reference: string) {
    this.message.set(`Le trajet ${reference} a été annulé.`);
    this.reload();
  }
}
