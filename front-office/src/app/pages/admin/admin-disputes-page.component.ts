import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, catchError, map, of, startWith, switchMap } from 'rxjs';
import { AdminDisputeSummary, AdminPage } from '../../models/admin.model';
import { AdminService } from '../../services/admin.service';
import { adminDate } from './admin-display';
import { AdminPaginationComponent } from './admin-pagination.component';

@Component({
  standalone: true,
  imports: [RouterLink, AdminPaginationComponent],
  templateUrl: './admin-disputes-page.component.html',
})
export class AdminDisputesPageComponent {
  private readonly service = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly retry = new Subject<void>();
  readonly result = signal<AdminPage<AdminDisputeSummary> | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly date = adminDate;

  constructor() {
    this.route.queryParamMap.pipe(
      map(params => Number(params.get('page'))),
      map(page => Number.isInteger(page) && page >= 0 && page <= 2147483647 ? page : 0),
      switchMap(page => this.retry.pipe(
        startWith(undefined),
        switchMap(() => {
          this.loading.set(true);
          this.result.set(null);
          this.error.set(false);
          return this.service.disputes(page).pipe(
            map(result => ({ result, error: false })),
            catchError(() => of({ result: null, error: true })),
          );
        }),
      )),
      takeUntilDestroyed(),
    ).subscribe(({ result, error }) => {
      this.result.set(result);
      this.error.set(error);
      this.loading.set(false);
    });
  }

  changePage(page: number) {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page: page || null } });
  }

  reload() {
    this.retry.next();
  }
}
