import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CommercialContentService } from '../../services/commercial-content.service';

/**
 * FooterLink interface representing a navigation link
 */
interface FooterLink {
  label: string;
  href?: string;
  routerLink?: string;
}

/**
 * FooterSection interface representing a column of links
 */
interface FooterSection {
  title: string;
  links: FooterLink[];
}

/**
 * SocialLink interface representing a social media link
 */
interface SocialLink {
  name: string;
  href: string;
  icon: string;
}

/**
 * FooterComponent - Site footer with navigation links and social media.
 * Contains platform links, support links, legal information, and social icons.
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
          { label: 'A propos de nous', href: '#' },
          { label: 'Comment ca marche', routerLink: '/comment-ca-marche' },
          { label: this.commercialContent.content().footerCommercialLink, href: '#' },
          { label: 'Nous contacter', routerLink: '/contact' },
        ],
      },
    ];
  }

  /**
   * Social media links
   */
  socialLinks: SocialLink[] = [
    { name: 'Facebook', href: '#', icon: 'facebook' },
    { name: 'Twitter', href: '#', icon: 'twitter' },
    { name: 'Instagram', href: '#', icon: 'instagram' },
  ];
}
