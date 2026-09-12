import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Step interface representing a single step in the how-it-works flow
 */
interface Step {
  number: number;
  title: string;
  description: string;
  icon: string;
}

/**
 * HowItWorksComponent - Explains the process for both senders and travelers.
 * Displays step-by-step instructions for using the platform.
 */
@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './how-it-works.component.html',
})
export class HowItWorksComponent {
  /**
   * Steps for package senders
   */
  senderSteps: Step[] = [
    {
      number: 1,
      title: 'Recherchez',
      description: 'Entrez votre ville de départ et votre destination pour trouver des voyageurs.',
      icon: 'search',
    },
    {
      number: 2,
      title: 'Comparez',
      description: 'Consultez les prix, poids disponibles et avis des voyageurs.',
      icon: 'compare',
    },
    {
      number: 3,
      title: 'Réservez',
      description: "Réservation instantanée ou demande d'approbation selon vos préférences.",
      icon: 'book',
    },
    {
      number: 4,
      title: 'Récupérez',
      description: 'Votre colis arrive à destination. Laissez un avis sur le voyageur.',
      icon: 'check',
    },
  ];

  /**
   * Steps for travelers offering their services
   */
  travelerSteps: Step[] = [
    {
      number: 1,
      title: 'Publiez',
      description: 'Indiquez votre trajet, le poids disponible et votre tarif au kilo.',
      icon: 'publish',
    },
    {
      number: 2,
      title: 'Recevez',
      description: "Recevez les demandes des expéditeurs par e-mail et sur l'app.",
      icon: 'notification',
    },
    {
      number: 3,
      title: 'Acceptez',
      description: 'Validez ou refusez les demandes selon vos critères.',
      icon: 'accept',
    },
    {
      number: 4,
      title: 'Gagnez',
      description: 'Recevez votre paiement après livraison (commission 7%).',
      icon: 'earn',
    },
  ];
}
