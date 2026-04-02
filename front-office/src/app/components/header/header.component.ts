import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * HeaderComponent - Fixed navigation header with logo, nav links, and auth buttons.
 * Provides the main navigation for the application.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  /**
   * Navigation links displayed in the header
   */
  navLinks = [
    { href: '#comment-ca-marche', label: 'Comment ça marche' },
    { href: '#avantages', label: 'Avantages' },
    { href: '#securite', label: 'Sécurité' },
    { href: '#temoignages', label: 'Témoignages' },
  ];

  /**
   * Controls mobile menu visibility
   */
  isMobileMenuOpen = false;

  /**
   * Toggles mobile menu state
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
