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
 * SecurityComponent - Displays the platform's security features and identity verification.
 * Shows trust signals and verification processes.
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
      title: "Pièce d'identité obligatoire",
      description: "Chaque utilisateur doit fournir une pièce d'identité valide lors de l'inscription.",
    },
    {
      title: 'Vérification manuelle',
      description: 'Notre équipe vérifie chaque document avant validation du compte.',
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
   * Sample verified user data for the demo card
   */
  verifiedUser = {
    name: 'Jean Dupont',
    email: 'j.dupont&#64;email.com',
    phone: '+33 6 ** ** ** **',
    verified: true,
  };
}
