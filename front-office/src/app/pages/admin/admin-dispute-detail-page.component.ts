import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, catchError, map, of, startWith, switchMap } from 'rxjs';
import { AdminDisputeDetail } from '../../models/admin.model';
import { AdminService } from '../../services/admin.service';
import { adminDate } from './admin-display';

@Component({
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-dispute-detail-page.component.html',
})
export class AdminDisputeDetailPageComponent {
  private readonly service = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly retry = new Subject<void>();
  readonly detail = signal<AdminDisputeDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<'missing' | 'failed' | null>(null);
  readonly date = adminDate;

  constructor() {
    this.route.paramMap.pipe(
      switchMap(params => this.retry.pipe(
        startWith(undefined),
        switchMap(() => {
          this.loading.set(true);
          this.detail.set(null);
          this.error.set(null);
          return this.service.dispute(params.get('id')!).pipe(
            map(detail => ({ detail, error: null })),
            catchError((error: HttpErrorResponse) => of({
              detail: null,
              error: error.status === 404 ? 'missing' as const : 'failed' as const,
            })),
          );
        }),
      )),
      takeUntilDestroyed(),
    ).subscribe(({ detail, error }) => {
      this.detail.set(detail);
      this.error.set(error);
      this.loading.set(false);
    });
  }

  reload() {
    this.retry.next();
  }
}
