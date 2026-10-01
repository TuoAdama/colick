import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ParcelRequest } from '../../models/parcel-request.model';
import { ParcelRequestService } from '../../services/parcel-request.service';

@Component({
  selector: 'app-parcel-requests-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './parcel-requests-page.component.html',
})
export class ParcelRequestsPageComponent implements OnInit {
  private readonly parcelRequestService = inject(ParcelRequestService);

  myRequests: ParcelRequest[] = [];
  isLoadingMine = false;
  actionError = '';
  closingRequestId: number | null = null;
  cancellingRequestId: number | null = null;

  ngOnInit(): void {
    this.loadMyRequests();
  }

  loadMyRequests(): void {
    this.isLoadingMine = true;
    this.actionError = '';
    this.parcelRequestService.getMyRequests().subscribe({
      next: (requests) => {
        this.myRequests = requests;
        this.isLoadingMine = false;
      },
      error: () => {
        this.actionError = 'Impossible de charger vos publications.';
        this.isLoadingMine = false;
      },
    });
  }

  closeRequest(request: ParcelRequest): void {
    if (this.closingRequestId !== null) {
      return;
    }
    this.closingRequestId = request.id;
    this.actionError = '';
    this.parcelRequestService.closeRequest(request.id).subscribe({
      next: (updated) => {
        this.myRequests = this.myRequests.map((current) => current.id === updated.id ? updated : current);
        this.closingRequestId = null;
      },
      error: () => {
        this.actionError = 'Impossible de fermer cette demande.';
        this.closingRequestId = null;
      },
    });
  }

  cancelRequest(request: ParcelRequest): void {
    if (this.cancellingRequestId !== null) {
      return;
    }
    if (!confirm('Etes-vous sur de vouloir annuler cette demande ?')) {
      return;
    }

    this.cancellingRequestId = request.id;
    this.actionError = '';
    this.parcelRequestService.cancelRequest(request.id).subscribe({
      next: () => {
        this.myRequests = this.myRequests.map((current) =>
          current.id === request.id ? { ...current, status: 'CANCELLED' } : current
        );
        this.cancellingRequestId = null;
      },
      error: () => {
        this.actionError = 'Impossible d’annuler cette demande.';
        this.cancellingRequestId = null;
      },
    });
  }

  dateLabel(date?: string): string {
    if (!date) {
      return 'Date flexible';
    }
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return date;
    }
    return parsed.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  createdAtLabel(createdAt?: string): string | null {
    if (!createdAt) {
      return null;
    }
    const parsed = new Date(createdAt);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  statusLabel(status: ParcelRequest['status']): string {
    return ({ ACTIVE: 'Active', CLOSED: 'Fermee', CANCELLED: 'Annulee' } as Record<ParcelRequest['status'], string>)[status];
  }

  statusClass(status: ParcelRequest['status']): string {
    return ({
      ACTIVE: 'bg-success/10 text-success',
      CLOSED: 'bg-primary/10 text-primary',
      CANCELLED: 'bg-text-muted/10 text-text-muted',
    } as Record<ParcelRequest['status'], string>)[status];
  }
}
