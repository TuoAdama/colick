import { Injectable } from '@angular/core';
import { UserResponse } from '../models/auth.model';
import { ShareCardData } from '../models/share-card.model';
import { Trip } from '../models/trip.model';

@Injectable({
  providedIn: 'root',
})
export class ShareCardMapperService {
  mapActiveTripToShareCard(
    trip: Trip,
    user: Pick<UserResponse, 'firstName' | 'lastName' | 'email' | 'phone' | 'photoUrl'>,
    options: { availableWeight?: number | null; shareOrigin?: string | null } = {}
  ): ShareCardData {
    const departure = this.extractCityAndCountry(trip.departureAddress);
    const destination = this.extractCityAndCountry(trip.destination);
    const departureCity = departure.city ?? this.normalizeOptionalText(trip.departureAddress);
    const destinationCity = destination.city ?? this.normalizeOptionalText(trip.destination);
    const routeLabel = this.buildRouteLabel(departureCity, destinationCity);
    const formattedDepartureDate = this.formatDateAndTimeFr(trip.departureTime);
    const formattedArrivalDate = this.formatDateAndTimeFr(trip.arrivalTime);
    const shareUrl = this.buildShareUrl(trip, options.shareOrigin);

    return {
      departureCity,
      departureCountry: departure.country,
      destinationCity,
      destinationCountry: destination.country,
      routeLabel,
      formattedDateTime: formattedDepartureDate?.dateTime ?? null,
      formattedDate: formattedDepartureDate?.date ?? null,
      formattedTime: formattedDepartureDate?.time ?? null,
      formattedArrivalDateTime: formattedArrivalDate?.dateTime ?? null,
      formattedArrivalDate: formattedArrivalDate?.date ?? null,
      formattedArrivalTime: formattedArrivalDate?.time ?? null,
      travelerName:
        this.buildTravelerName(user.firstName, user.lastName)
        ?? this.normalizeOptionalText(trip.travelerName),
      phone: this.normalizeOptionalText(user.phone),
      email: this.normalizeOptionalText(user.email),
      travelerPhotoUrl: this.normalizeOptionalText(user.photoUrl ?? trip.travelerPhotoUrl),
      travelerRatingAverageLabel: this.formatRatingAverage(trip.travelerRatingAverage),
      travelerRatingCountLabel: this.formatRatingCount(trip.travelerRatingCount),
      availableWeightLabel: this.formatWeight(this.resolveAvailableWeight(trip, options.availableWeight)),
      pricePerKiloLabel: this.formatPricePerKilo(trip.pricePerKilo),
      shareUrl,
      shareUrlLabel: this.formatShareUrlLabel(shareUrl),
      tripReference: this.normalizeOptionalText(trip.reference) ?? this.buildTripReference(trip.id),
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

  private buildTravelerName(firstName?: string | null, lastName?: string | null): string | null {
    const first = this.normalizeOptionalText(firstName);
    const last = this.normalizeOptionalText(lastName);

    if (first && last) {
      return `${first} ${last}`;
    }

    return first ?? last ?? null;
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

  private buildRouteLabel(departureCity: string | null, destinationCity: string | null): string | null {
    if (departureCity && destinationCity) {
      return `${departureCity} → ${destinationCity}`;
    }

    return departureCity ?? destinationCity ?? null;
  }

  private formatDateAndTimeFr(value?: string | null): { date: string; time: string; dateTime: string } | null {
    if (!value) {
      return null;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    const date = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(parsedDate);
    const normalizedDate = date.replace(/(\d{2}\s+)([a-zà-ÿ])/u, (_, prefix: string, firstLetter: string) =>
      `${prefix}${firstLetter.toUpperCase()}`
    );
    const time = new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(parsedDate);

    return {
      date: normalizedDate,
      time,
      dateTime: `${normalizedDate} • ${time}`,
    };
  }

  private resolveAvailableWeight(trip: Trip, override?: number | null): number | null {
    if (this.isValidNumber(override)) {
      return override;
    }

    if (this.isValidNumber(trip.availableWeight)) {
      return trip.availableWeight;
    }

    if (this.isValidNumber(trip.maxWeight)) {
      return trip.maxWeight;
    }

    return null;
  }

  private isValidNumber(value?: number | null): value is number {
    return value !== null && value !== undefined && !Number.isNaN(value);
  }

  private formatWeight(value?: number | null): string | null {
    if (!this.isValidNumber(value)) {
      return null;
    }

    return `${new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)} kg`;
  }

  private formatPricePerKilo(value?: number | null): string | null {
    if (!this.isValidNumber(value)) {
      return null;
    }

    const minimumFractionDigits = Number.isInteger(value) ? 0 : 2;
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits,
      maximumFractionDigits: 2,
    }).format(value);
    return `${formattedAmount}€ / kg`;
  }

  private formatRatingAverage(value?: number | null): string | null {
    if (!this.isValidNumber(value)) {
      return null;
    }

    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }

  private formatRatingCount(value?: number | null): string | null {
    if (!this.isValidNumber(value) || value <= 0) {
      return null;
    }

    return `${new Intl.NumberFormat('fr-FR').format(value)} avis`;
  }

  private buildTripReference(tripId: number): string {
    return `#T${tripId.toString(36).toUpperCase().padStart(4, '0')}`;
  }

  private buildShareUrl(trip: Trip, shareOrigin?: string | null): string {
    const queryParams = new URLSearchParams({
      from: trip.departureAddress,
      to: trip.destination,
    });
    const date = this.buildSearchDate(trip.departureTime);
    if (date) {
      queryParams.set('date', date);
    }

    const normalizedOrigin = this.normalizeOptionalText(shareOrigin)
      ?? this.resolveCurrentOrigin();
    const path = `/search?${queryParams.toString()}`;
    return normalizedOrigin ? `${normalizedOrigin}${path}` : path;
  }

  private buildSearchDate(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate.toISOString().slice(0, 10);
  }

  private resolveCurrentOrigin(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.location.origin;
  }

  private formatShareUrlLabel(value: string): string {
    try {
      const url = new URL(value, this.resolveCurrentOrigin() ?? 'https://colick.com');
      return `${url.host}${url.pathname}`;
    } catch {
      return value;
    }
  }
}
