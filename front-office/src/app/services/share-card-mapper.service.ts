import { Injectable } from '@angular/core';
import { UserResponse } from '../models/auth.model';
import { ShareCardData } from '../models/share-card.model';
import { Trip } from '../models/trip.model';

@Injectable({
  providedIn: 'root',
})
export class ShareCardMapperService {
  mapActiveTripToShareCard(trip: Trip, user: Pick<UserResponse, 'email' | 'phone'>): ShareCardData {
    const destination = this.extractCityAndCountry(trip.destination);

    return {
      city: destination.city,
      country: destination.country,
      formattedDate: this.formatDateFr(trip.departureTime),
      phone: this.normalizeOptionalText(user.phone),
      email: this.normalizeOptionalText(user.email),
      availableWeightLabel: this.formatWeight(trip.availableWeight),
      pricePerKiloLabel: this.formatPricePerKilo(trip.pricePerKilo),
    };
  }

  buildFileDate(value?: string | null): string {
    const parsedDate = value ? new Date(value) : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
      return new Date().toISOString().slice(0, 10);
    }

    return parsedDate.toISOString().slice(0, 10);
  }

  private normalizeOptionalText(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private extractCityAndCountry(destination?: string | null): { city: string | null; country: string | null } {
    const normalizedDestination = this.normalizeOptionalText(destination);
    if (!normalizedDestination) {
      return { city: null, country: null };
    }

    const parts = normalizedDestination
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (parts.length === 0) {
      return { city: null, country: null };
    }

    if (parts.length === 1) {
      return { city: parts[0], country: null };
    }

    return {
      city: parts[0],
      country: parts.slice(1).join(', '),
    };
  }

  private formatDateFr(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(parsedDate);
  }

  private formatWeight(value?: number | null): string | null {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return null;
    }

    return `${new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)} kg`;
  }

  private formatPricePerKilo(value?: number | null): string | null {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return null;
    }

    return `${new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)} / kg`;
  }
}
