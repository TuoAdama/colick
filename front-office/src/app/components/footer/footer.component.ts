import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * FooterLink interface representing a navigation link
 */
interface FooterLink {
  label: string;
  href: string;
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
  imports: [CommonModule],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  /**
   * Current year for copyright notice
   */
  currentYear = new Date().getFullYear();

  /**
   * Footer navigation sections
   */
  footerSections: FooterSection[] = [
    {
      title: 'Plateforme',
      links: [
        { label: 'Rechercher un voyage', href: '#' },
        { label: 'Proposer un voyage', href: '#' },
        { label: 'Comment ça marche', href: '#' },
        { label: 'Tarifs', href: '#' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: "Centre d'aide", href: '#' },
        { label: 'Nous contacter', href: '#' },
        { label: 'FAQ', href: '#' },
        { label: 'Signaler un problème', href: '#' },
      ],
    },
    {
      title: 'Légal',
      links: [
        { label: 'Conditions générales', href: '#' },
        { label: 'Politique de confidentialité', href: '#' },
        { label: 'Mentions légales', href: '#' },
      ],
    },
  ];

  /**
   * Social media links
   */
  socialLinks: SocialLink[] = [
    { name: 'Facebook', href: '#', icon: 'facebook' },
    { name: 'Twitter', href: '#', icon: 'twitter' },
    { name: 'Instagram', href: '#', icon: 'instagram' },
  ];
}
