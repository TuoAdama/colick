import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CommercialContentService } from '../../services/commercial-content.service';

/**
 * FooterLink interface representing a navigation link
 */
interface FooterLink {
  label: string;
  routerLink: string;
}

/**
 * FooterSection interface representing a column of links
 */
interface FooterSection {
  title: string;
  links: FooterLink[];
}

/**
 * FooterComponent - Site footer with platform, support, and legal navigation.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  private readonly commercialContent = inject(CommercialContentService);
  /**
   * Current year for copyright notice
   */
  currentYear = new Date().getFullYear();

  /**
   * Footer navigation sections
   */
  get footerSections(): FooterSection[] {
    return [
      {
        title: 'PLATEFORME',
        links: [
          { label: 'À propos de nous', routerLink: '/a-propos' },
          { label: 'Comment ca marche', routerLink: '/comment-ca-marche' },
          { label: this.commercialContent.content().footerCommercialLink, routerLink: '/tarifs' },
        ],
      },
      {
        title: 'ASSISTANCE',
        links: [
          { label: 'Aide', routerLink: '/aide' },
          { label: 'Nous contacter', routerLink: '/contact' },
          { label: 'Sécurité', routerLink: '/securite' },
        ],
      },
      {
        title: 'INFORMATIONS LÉGALES',
        links: [
          { label: 'CGU', routerLink: '/cgu' },
          { label: 'Confidentialité', routerLink: '/confidentialite' },
          { label: 'Mentions légales', routerLink: '/mentions-legales' },
          { label: 'Annulation et litiges', routerLink: '/annulation-litiges' },
        ],
      },
    ];
  }
}
