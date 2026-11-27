import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, map, of, startWith, switchMap } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { AdminPage, AdminUser } from '../../models/admin.model';
import { AdminPaginationComponent } from './admin-pagination.component';
import { adminDate, connectionLabels } from './admin-display';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, AdminPaginationComponent],
  templateUrl: './admin-users-page.component.html',
})
export class AdminUsersPageComponent {
  private readonly service = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly retry = new Subject<void>();
  readonly result = signal<AdminPage<AdminUser> | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  query = '';
  readonly date = adminDate;
  readonly connections = connectionLabels;

  constructor() {
    this.route.queryParamMap.pipe(
      switchMap(params => {
        this.query = params.get('q') ?? '';
        const page = Math.max(0, Number(params.get('page')) || 0);
        return this.retry.pipe(startWith(undefined), switchMap(() => {
          this.loading.set(true);
          this.error.set(false);
          this.result.set(null);
          return this.service.users(page, this.query).pipe(
            map(result => ({ result, error: false })),
            catchError(() => of({ result: null, error: true })),
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

  search() { this.navigate(0, this.query.trim()); }
  changePage(page: number) { this.navigate(page, this.route.snapshot.queryParamMap.get('q') ?? ''); }
  reload() { this.retry.next(); }

  private navigate(page: number, q: string) {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page, q: q || null } });
  }
}
