import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TripAlertService } from '../../services/trip-alert.service';
import { TripAlert } from '../../models/trip-alert.model';

@Component({
  selector: 'app-alerts-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './alerts-page.component.html',
})
export class AlertsPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly tripAlertService = inject(TripAlertService);
  private readonly router = inject(Router);

  alerts: TripAlert[] = [];
  isLoadingAlerts = false;
  actionError = '';
  deletingAlertId: number | null = null;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login']);
      return;
    }

    this.loadAlerts();
  }

  loadAlerts(): void {
    this.isLoadingAlerts = true;
    this.actionError = '';
    this.tripAlertService.getMyAlerts().subscribe({
      next: (alerts) => {
        this.alerts = alerts;
        this.isLoadingAlerts = false;
      },
      error: () => {
        this.actionError = 'Impossible de charger vos alertes pour le moment.';
        this.isLoadingAlerts = false;
      },
    });
  }

  deleteAlert(alert: TripAlert): void {
    if (this.deletingAlertId !== null) {
      return;
    }
    if (!confirm('Etes-vous sur de vouloir supprimer cette alerte ?')) {
      return;
    }

    this.actionError = '';
    this.deletingAlertId = alert.id;
    this.tripAlertService.deleteAlert(alert.id).subscribe({
      next: () => {
        this.alerts = this.alerts.filter((currentAlert) => currentAlert.id !== alert.id);
        this.deletingAlertId = null;
      },
      error: () => {
        this.actionError = "Impossible de supprimer cette alerte pour le moment.";
        this.deletingAlertId = null;
      },
    });
  }

  alertSearchQueryParams(alert: TripAlert): Record<string, string | number | null> {
    return {
      from: alert.departure,
      to: alert.destination,
      date: alert.date ?? null,
      sort: alert.sort ?? 'price_asc',
      minPrice: alert.minPrice ?? null,
      maxPrice: alert.maxPrice ?? null,
    };
  }

  createdAtLabel(createdAt?: string): string | null {
    if (!createdAt) {
      return null;
    }
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  dateLabel(date?: string): string {
    if (!date) {
      return 'Toutes dates';
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

  priceLabel(alert: TripAlert): string {
    if (alert.minPrice !== null && alert.minPrice !== undefined && alert.maxPrice !== null && alert.maxPrice !== undefined) {
      return `${alert.minPrice} - ${alert.maxPrice} €/kg`;
    }
    if (alert.minPrice !== null && alert.minPrice !== undefined) {
      return `Des ${alert.minPrice} €/kg`;
    }
    if (alert.maxPrice !== null && alert.maxPrice !== undefined) {
      return `Jusqu'a ${alert.maxPrice} €/kg`;
    }
    return 'Tous prix';
  }
}
