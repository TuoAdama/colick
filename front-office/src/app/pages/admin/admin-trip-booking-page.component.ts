import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, map, startWith, switchMap, tap } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { adminDate, statusLabel } from './admin-display';
import { adminPageIndex, adminRequest } from './admin-request';

@Component({
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-trip-booking-page.component.html',
})
export class AdminTripBookingPageComponent {
  private readonly service = inject(AdminService);
  readonly photoUrl = (tripId: number, bookingId: number) => this.service.tripBookingPhotoUrl(tripId, bookingId);
  private readonly route = inject(ActivatedRoute);
  private readonly retry = new Subject<void>();
  readonly tripId = toSignal(this.route.paramMap.pipe(map(params => Number(params.get('id')))),
    { initialValue: 0 });
  readonly returnQuery = toSignal(this.route.queryParamMap.pipe(map(params => ({
    listPage: adminPageIndex(params.get('listPage')), page: adminPageIndex(params.get('page')),
  }))), { initialValue: { listPage: 0, page: 0 } });
  readonly photoUnavailable = signal(false);
  readonly date = adminDate;
  readonly status = statusLabel;

  readonly detail = toSignal(this.route.paramMap.pipe(
    switchMap(params => this.retry.pipe(
      startWith(undefined),
      tap(() => this.photoUnavailable.set(false)),
      switchMap(() => adminRequest(
        this.service.tripBookingDetail(Number(params.get('id')), Number(params.get('bookingId'))),
        'Impossible de charger la réservation.', 'Réservation introuvable.',
      )),
    )),
  ), { initialValue: { state: 'loading' } });

  reload() { this.retry.next(); }
}
