import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { Location } from '../../models/location.model';

/**
 * HeroComponent - Main hero section with title, description, CTAs, and search preview card.
 * This is the first section users see when visiting the landing page.
 */
@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink, AutocompleteComponent],
  templateUrl: './hero.component.html',
})
export class HeroComponent {
  private readonly router = inject(Router);

  departure: Location | null = null;
  destination: Location | null = null;

  onDepartureSelected(location: Location): void {
    this.departure = location;
  }

  onDestinationSelected(location: Location): void {
    this.destination = location;
  }

  search(): void {
    this.router.navigate(['/search'], {
      queryParams: {
        ...(this.departure && { from: this.departure.name }),
        ...(this.destination && { to: this.destination.name }),
      },
    });
  }

  /**
   * Trust badges displayed below the CTA buttons
   */
  trustBadges = [
    { icon: 'verified', label: 'Identité vérifiée' },
    { icon: 'secure', label: 'Paiement sécurisé' },
    { icon: 'certified', label: 'Avis certifiés' },
  ];

  /**
   * Sample available travelers shown in the search preview
   */
  availableTravelers = [
    { initials: 'AB', bgColor: 'bg-secondary' },
    { initials: 'CD', bgColor: 'bg-primary' },
    { initials: 'EF', bgColor: 'bg-accent' },
  ];
}
