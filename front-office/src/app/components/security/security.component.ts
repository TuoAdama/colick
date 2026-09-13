import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommercialContentService } from '../../services/commercial-content.service';

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
  readonly commercialContent = inject(CommercialContentService);

  /**
   * List of security features
   */
  get securityFeatures(): SecurityFeature[] {
    return [
      {
        title: 'Compte activé par e-mail',
        description: "Chaque compte local est activé depuis un lien envoyé à l'adresse d'inscription.",
      },
      {
        title: 'Support humain',
        description: "Notre équipe reste disponible pour accompagner les utilisateurs à chaque étape.",
      },
      {
        title: this.commercialContent.content().securityTitle,
        description: this.commercialContent.content().securityDescription,
      },
      {
        title: "Système d'avis",
        description: 'Les avis certifiés permettent d\'identifier les voyageurs de confiance.',
      },
    ];
  }

  /**
   * Sample user data for the demo card
   */
  trustedUser = {
    name: 'Jean Dupont',
    email: 'j.dupont&#64;email.com',
    phone: '+33 6 ** ** ** **',
  };
}
