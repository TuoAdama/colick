import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * SecurityFeature interface representing a security aspect
 */
interface SecurityFeature {
  title: string;
  description: string;
}

/**
 * SecurityComponent - Displays the platform's security and trust features.
 */
@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './security.component.html',
})
export class SecurityComponent {
  /**
   * List of security features
   */
  securityFeatures: SecurityFeature[] = [
    {
      title: 'Compte activé par e-mail',
      description: "Chaque compte local est activé depuis un lien envoyé à l'adresse d'inscription.",
    },
    {
      title: 'Support humain',
      description: "Notre équipe reste disponible pour accompagner les utilisateurs à chaque étape.",
    },
    {
      title: 'Paiement sécurisé',
      description: 'Les transactions sont sécurisées et le paiement est libéré après confirmation de livraison.',
    },
    {
      title: "Système d'avis",
      description: 'Les avis certifiés permettent d\'identifier les voyageurs de confiance.',
    },
  ];

  /**
   * Sample user data for the demo card
   */
  trustedUser = {
    name: 'Jean Dupont',
    email: 'j.dupont&#64;email.com',
    phone: '+33 6 ** ** ** **',
  };
}
