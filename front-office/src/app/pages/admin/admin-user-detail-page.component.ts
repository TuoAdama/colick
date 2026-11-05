import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, map, of, startWith, switchMap } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { AdminUserDetail } from '../../models/admin.model';
import { adminDate, connectionLabels } from './admin-display';

@Component({
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-user-detail-page.component.html',
})
export class AdminUserDetailPageComponent {
  private readonly service = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly retry = new Subject<void>();
  readonly detail = signal<AdminUserDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly date = adminDate;
  readonly connections = connectionLabels;

  constructor() {
    this.route.paramMap.pipe(
      switchMap(params => this.retry.pipe(startWith(undefined), switchMap(() => {
        this.loading.set(true);
        this.detail.set(null);
        this.error.set('');
        return this.service.detail(Number(params.get('id'))).pipe(
          map(detail => ({ detail, error: '' })),
          catchError((error: HttpErrorResponse) => of({ detail: null, error: error.status === 404
            ? 'Utilisateur introuvable.' : 'Impossible de charger cet utilisateur.' })),
        );
      }))),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe(state => {
      this.detail.set(state.detail);
      this.error.set(state.error);
      this.loading.set(false);
    });
  }

  reload() { this.retry.next(); }
}
