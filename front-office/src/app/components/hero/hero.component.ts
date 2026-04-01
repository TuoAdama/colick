import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * HeroComponent - Main hero section with title, description, CTAs, and search preview card.
 * This is the first section users see when visiting the landing page.
 */
@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero.component.html',
})
export class HeroComponent {
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
