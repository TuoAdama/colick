import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { ParcelRequest } from '../../models/parcel-request.model';
import { ParcelRequestService } from '../../services/parcel-request.service';
import { createdAtLabel, dateLabel, statusClass, statusLabel } from '../../shared/utils/parcel-request-presentation';

@Component({
  selector: 'app-parcel-request-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './parcel-request-detail-page.component.html',
})
export class ParcelRequestDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ParcelRequestService);
  private readonly destroyRef = inject(DestroyRef);

  request: ParcelRequest | null = null;
  isLoading = true;
  isProcessing = false;
  loadError = '';
  actionError = '';
  accessDenied = false;
  private requestId: number | null = null;

  readonly dateLabel = dateLabel;
  readonly createdAtLabel = createdAtLabel;
  readonly statusClass = statusClass;
  readonly statusLabel = statusLabel;

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap((params) => {
        const value = params.get('id') || '';
        const id = Number(value);
        this.requestId = null;
        this.request = null;
        this.loadError = '';
        this.actionError = '';
        this.isProcessing = false;
        this.accessDenied = false;
        this.isLoading = true;
        if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(id)) {
          this.isLoading = false;
          void this.router.navigate(['/404']);
          return EMPTY;
        }
        this.requestId = id;
        return this.fetchRequest(id);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((request) => {
      this.request = request;
      this.isLoading = false;
    });
  }

  retry(): void {
    if (this.requestId === null || this.isLoading || this.accessDenied) return;
    this.isLoading = true;
    this.loadError = '';
    this.fetchRequest(this.requestId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((request) => {
      if (request.id !== this.requestId) return;
      this.request = request;
      this.isLoading = false;
    });
  }

  closeRequest(): void {
    const request = this.request;
    if (!request || request.status !== 'ACTIVE' || this.isProcessing) return;
    this.isProcessing = true;
    this.actionError = '';
    this.service.closeRequest(request.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => {
        if (this.requestId !== request.id) return;
        this.request = updated;
        this.isProcessing = false;
      },
      error: () => this.failAction(request.id, 'Impossible de fermer cette demande.'),
    });
  }

  cancelRequest(): void {
    const request = this.request;
    if (!request || request.status !== 'ACTIVE' || this.isProcessing) return;
    if (!confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) return;
    this.isProcessing = true;
    this.actionError = '';
    this.service.cancelRequest(request.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.requestId !== request.id) return;
        this.request = { ...request, status: 'CANCELLED' };
        this.isProcessing = false;
      },
      error: () => this.failAction(request.id, 'Impossible d’annuler cette demande.'),
    });
  }

  private fetchRequest(id: number) {
    return this.service.getMyRequest(id).pipe(catchError((error: HttpErrorResponse) => {
      if (id !== this.requestId) return EMPTY;
      this.isLoading = false;
      this.request = null;
      if (error.status === 404) {
        void this.router.navigate(['/404']);
      } else {
        this.accessDenied = error.status === 403;
        this.loadError = this.accessDenied
          ? 'Vous n’avez pas accès à cette demande.'
          : 'Impossible de charger le détail de cette demande.';
      }
      return EMPTY;
    }));
  }

  private failAction(id: number, message: string): void {
    if (this.requestId !== id) return;
    this.actionError = message;
    this.isProcessing = false;
  }
}
