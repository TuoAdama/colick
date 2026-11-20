import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, distinctUntilChanged, map, startWith, switchMap } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { adminDate } from './admin-display';
import { AdminPaginationComponent } from './admin-pagination.component';
import { adminPageIndex, adminRequest } from './admin-request';

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
  readonly date = adminDate;
  readonly result = toSignal(this.route.queryParamMap.pipe(
    map(params => adminPageIndex(params.get('page'))),
    distinctUntilChanged(),
    switchMap(page => this.retry.pipe(
      startWith(undefined),
      switchMap(() => adminRequest(this.service.disputes(page), 'Impossible de charger les litiges.')),
    )),
  ), { initialValue: { state: 'loading' } });

  changePage(page: number) {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page: page || null } });
  }

  reload() {
    this.retry.next();
  }
}
