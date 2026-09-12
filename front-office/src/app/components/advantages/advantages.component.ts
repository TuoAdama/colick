import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Advantage interface representing a platform benefit
 */
interface Advantage {
  title: string;
  description: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
}

/**
 * AdvantagesComponent - Displays the platform advantages and benefits.
 * Shows features like competitive pricing, fast delivery, security, etc.
 */
@Component({
  selector: 'app-advantages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './advantages.component.html',
})
export class AdvantagesComponent {
  /**
   * List of platform advantages
   */
  advantages: Advantage[] = [
    {
      title: 'Prix compétitifs',
      description: "Économisez jusqu'à 70% par rapport aux services de transport traditionnels.",
      icon: 'price',
      iconBgColor: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Livraison rapide',
      description: "Vos colis arrivent avec le voyageur, sans délai d'attente interminable.",
      icon: 'fast',
      iconBgColor: 'bg-secondary/10',
      iconColor: 'text-secondary',
    },
    {
      title: '100% sécurisé',
      description: "Activation du compte et paiement sécurisé sur la plateforme.",
      icon: 'secure',
      iconBgColor: 'bg-accent/10',
      iconColor: 'text-accent',
    },
    {
      title: 'Avis vérifiés',
      description: 'Consultez les avis des autres utilisateurs pour choisir le bon voyageur.',
      icon: 'reviews',
      iconBgColor: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      title: 'Notifications',
      description: 'Restez informé à chaque étape grâce aux notifications par e-mail.',
      icon: 'notifications',
      iconBgColor: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: '50+ destinations',
      description: 'Envoyez vos colis vers plus de 50 destinations à travers le monde.',
      icon: 'destinations',
      iconBgColor: 'bg-secondary/10',
      iconColor: 'text-secondary',
    },
  ];
}
