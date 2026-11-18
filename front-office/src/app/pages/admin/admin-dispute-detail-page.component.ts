import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, startWith, switchMap } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { adminDate } from './admin-display';
import { adminRequest } from './admin-request';

@Component({
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-dispute-detail-page.component.html',
})
export class AdminDisputeDetailPageComponent {
  private readonly service = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly retry = new Subject<void>();
  readonly date = adminDate;
  readonly detail = toSignal(this.route.paramMap.pipe(
    switchMap(params => this.retry.pipe(
      startWith(undefined),
      switchMap(() => adminRequest(
        this.service.dispute(params.get('id')!),
        'Impossible de charger ce litige.',
        'Litige introuvable.',
      )),
    )),
  ), { initialValue: { state: 'loading' } });

  reload() {
    this.retry.next();
  }
}
