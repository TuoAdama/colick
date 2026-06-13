import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

/**
 * LandingPageComponent - Assembles all landing page sections.
 * This is the main entry point for the '/' route.
 */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent {
  private readonly router = inject(Router);

  departureQuery = '';
  destinationQuery = '';
  travelDate = '';

  searchTrips(): void {
    const from = this.departureQuery.trim();
    const to = this.destinationQuery.trim();
    const date = this.travelDate.trim();

    void this.router.navigate(['/search'], {
      queryParams: {
        ...(from && { from }),
        ...(to && { to }),
        ...(date && { date }),
      },
    });
  }

  readonly stats = [
    {
      icon: 'travel_explore',
      value: '30 000+',
      label: 'recherches effectuees ce mois',
      tone: 'text-accent bg-accent/10',
    },
    {
      icon: 'inventory_2',
      value: '5 000+',
      label: 'colis deja livres en Afrique et en Europe',
      tone: 'text-accent bg-accent/10',
    },
    {
      icon: 'add_circle',
      value: '3 clics',
      label: 'pour publier votre trajet',
      tone: 'text-primary bg-gray-200',
    },
  ];

  readonly trustCards = [
    {
      icon: 'verified_user',
      title: 'Profils verifies',
      description: 'Chaque membre est authentifie pour creer un cadre fiable.',
      tone: 'text-accent bg-accent/10',
    },
    {
      icon: 'payments',
      title: 'Zero stress',
      description: 'Le paiement reste securise jusqu a confirmation de livraison.',
      tone: 'text-accent bg-accent/10',
    },
    {
      icon: 'forum',
      title: 'Support humain',
      description: 'Notre equipe reste disponible pour vous aider a chaque etape.',
      tone: 'text-primary bg-gray-200',
    },
  ];

  readonly trips = [
    {
      tag: 'Flash',
      price: '12€',
      departure: 'Paris, FR',
      arrival: 'Abidjan, CI',
      date: '24 Mai 2024',
      traveler: 'Moussa K.',
      rating: '4.9',
      capacity: '8kg libres',
      avatar: 'MK',
      avatarTone: 'bg-primary',
    },
    {
      tag: 'Certifie',
      price: '8€',
      departure: 'Marseille, FR',
      arrival: 'Casablanca, MA',
      date: '28 Mai 2024',
      traveler: 'Sarah B.',
      rating: '5.0',
      capacity: '15kg libres',
      avatar: 'SB',
      avatarTone: 'bg-secondary',
    },
    {
      tag: 'Urgent',
      price: '15€',
      departure: 'Lyon, FR',
      arrival: 'Dakar, SN',
      date: '02 Juin 2024',
      traveler: 'Jean-Luc D.',
      rating: '4.8',
      capacity: '5kg libres',
      avatar: 'JD',
      avatarTone: 'bg-accent',
    },
  ];
}
