import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Testimonial interface representing a user review
 */
interface Testimonial {
  content: string;
  author: string;
  role: string;
  initials: string;
  bgColor: string;
  rating: number;
}

/**
 * TestimonialsComponent - Displays user testimonials and reviews.
 * Shows real feedback from senders and travelers using the platform.
 */
@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials.component.html',
})
export class TestimonialsComponent {
  /**
   * List of testimonials from users
   */
  testimonials: Testimonial[] = [
    {
      content:
        "J'ai envoyé un colis à ma famille à Abidjan pour 3 fois moins cher qu'avec un transporteur classique. Le voyageur était très professionnel et le colis est arrivé en parfait état.",
      author: 'Marie K.',
      role: 'Expéditrice - Paris',
      initials: 'MK',
      bgColor: 'bg-primary',
      rating: 5,
    },
    {
      content:
        'Grâce à Coliclic, je rentabilise mes voyages entre la France et le Sénégal. La plateforme est simple à utiliser et la commission de 7% est raisonnable.',
      author: 'Amadou D.',
      role: 'Voyageur - Dakar',
      initials: 'AD',
      bgColor: 'bg-secondary',
      rating: 5,
    },
    {
      content:
        "Les avis et le paiement sécurisé m'ont rassurée. J'utilise Coliclic depuis 6 mois et je n'ai jamais eu de problème. Je recommande vivement !",
      author: 'Sophie T.',
      role: 'Expéditrice - Lyon',
      initials: 'ST',
      bgColor: 'bg-accent',
      rating: 5,
    },
  ];

  /**
   * Helper to generate an array for star rating
   * @param count - Number of stars
   * @returns Array of numbers for ngFor iteration
   */
  getStarArray(count: number): number[] {
    return Array(count).fill(0);
  }
}
