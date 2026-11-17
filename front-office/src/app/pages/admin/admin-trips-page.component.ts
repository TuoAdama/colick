import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, distinctUntilChanged, map, startWith, switchMap } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { adminDate, statusLabel } from './admin-display';
import { AdminPaginationComponent } from './admin-pagination.component';
import { adminPageIndex, adminRequest } from './admin-request';
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
  readonly message = signal('');
  readonly date = adminDate;
  readonly status = statusLabel;

  readonly trips = toSignal(this.route.queryParamMap.pipe(
    map(params => adminPageIndex(params.get('page'))),
    distinctUntilChanged(),
    switchMap(page => this.refresh.pipe(
      startWith(undefined),
      switchMap(() => adminRequest(this.service.publishedTrips(page), 'Impossible de charger les trajets.')),
    )),
  ), { initialValue: { state: 'loading' } });

  changePage(page: number) {
    this.message.set('');
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page } });
  }

  reload() { this.refresh.next(); }

  tripCancelled(reference: string) {
    this.message.set(`Le trajet ${reference} a été annulé.`);
    this.reload();
  }
}
