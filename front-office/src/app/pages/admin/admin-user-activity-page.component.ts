import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { AdminBooking, AdminPage, AdminTrip } from '../../models/admin.model';
import { AdminPaginationComponent } from './admin-pagination.component';
import { adminDate, statusLabel } from './admin-display';

@Component({
  standalone: true,
  imports: [RouterLink, AdminPaginationComponent],
  templateUrl: './admin-user-activity-page.component.html',
})
export class AdminUserActivityPageComponent {
  private readonly service = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly retry = new Subject<void>();
  readonly result = signal<AdminPage<AdminTrip | AdminBooking> | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly kind = this.route.snapshot.data['kind'] as 'trips' | 'bookings';
  userId = 0;
  readonly date = adminDate;
  readonly status = statusLabel;

  constructor() {
    combineLatest([this.route.paramMap, this.route.queryParamMap]).pipe(
      switchMap(([params, query]) => {
        this.userId = Number(params.get('id'));
        const page = Math.max(0, Number(query.get('page')) || 0);
        return this.retry.pipe(startWith(undefined), switchMap(() => {
          this.loading.set(true);
          this.result.set(null);
          this.error.set('');
          const request: Observable<AdminPage<AdminTrip | AdminBooking>> = this.kind === 'trips'
            ? this.service.trips(this.userId, page) : this.service.bookings(this.userId, page);
          return request.pipe(
            map(result => ({ result, error: '' })),
            catchError((error: HttpErrorResponse) => of({ result: null, error: error.status === 404
              ? 'Utilisateur introuvable.' : 'Impossible de charger cet historique.' })),
          );
        }));
      }),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe(state => {
      this.result.set(state.result);
      this.error.set(state.error);
      this.loading.set(false);
    });
  }

  trips(): AdminTrip[] { return (this.result()?.items ?? []) as AdminTrip[]; }
  bookings(): AdminBooking[] { return (this.result()?.items ?? []) as AdminBooking[]; }
  reload() { this.retry.next(); }
  changePage(page: number) { void this.router.navigate([], { relativeTo: this.route, queryParams: { page } }); }
}
