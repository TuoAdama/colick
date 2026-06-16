import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ParcelRequest } from '../../models/parcel-request.model';
import { ParcelRequestService } from '../../services/parcel-request.service';
import { MessagingService } from '../../services/messaging.service';

type ParcelRequestsTab = 'available' | 'mine';

@Component({
  selector: 'app-parcel-requests-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './parcel-requests-page.component.html',
})
export class ParcelRequestsPageComponent implements OnInit {
  private readonly parcelRequestService = inject(ParcelRequestService);
  private readonly messagingService = inject(MessagingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  activeTab: ParcelRequestsTab = 'available';

  availableRequests: ParcelRequest[] = [];
  myRequests: ParcelRequest[] = [];
  isLoadingAvailable = false;
  isLoadingMine = false;
  actionError = '';
  contactingRequestId: number | null = null;
  closingRequestId: number | null = null;
  cancellingRequestId: number | null = null;

  departureFilter = '';
  destinationFilter = '';
  dateFilter = '';

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    this.activeTab = tab === 'mine' ? 'mine' : 'available';
    this.loadAvailableRequests();
    this.loadMyRequests();
  }

  setTab(tab: ParcelRequestsTab): void {
    this.activeTab = tab;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
  }

  loadAvailableRequests(): void {
    this.isLoadingAvailable = true;
    this.actionError = '';
    this.parcelRequestService.getAvailableRequests({
      departure: this.departureFilter,
      destination: this.destinationFilter,
      date: this.dateFilter,
    }).subscribe({
      next: (requests) => {
        this.availableRequests = requests;
        this.isLoadingAvailable = false;
      },
      error: () => {
        this.actionError = 'Impossible de charger les demandes disponibles.';
        this.isLoadingAvailable = false;
      },
    });
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

  contactSender(request: ParcelRequest): void {
    if (this.contactingRequestId !== null) {
      return;
    }

    this.contactingRequestId = request.id;
    this.actionError = '';
    this.messagingService.createConversationDraft({
      parcelRequestId: request.id,
      recipientId: request.senderId,
    }).subscribe({
      next: (conversation) => {
        void this.router.navigate(['/messages'], { queryParams: { conversationId: conversation.id } });
      },
      error: () => {
        this.actionError = 'Impossible de demarrer la conversation.';
        this.contactingRequestId = null;
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
        this.loadAvailableRequests();
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
        this.loadAvailableRequests();
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
