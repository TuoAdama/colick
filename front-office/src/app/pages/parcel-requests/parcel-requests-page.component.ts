import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { dateLabel, statusLabel, statusClass } from '../../shared/utils/parcel-request-presentation';
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

  readonly dateLabel = dateLabel;
  readonly statusLabel = statusLabel;
  readonly statusClass = statusClass;
}
