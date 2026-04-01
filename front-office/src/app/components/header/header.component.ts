import { Component, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * HeaderComponent - Fixed navigation header with logo, nav links, and auth buttons.
 * Shows login/register links when unauthenticated, user name and logout when authenticated.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, AsyncPipe],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  readonly authService = inject(AuthService);

  navLinks = [
    { href: '#comment-ca-marche', label: 'Comment ça marche' },
    { href: '#avantages', label: 'Avantages' },
    { href: '#securite', label: 'Sécurité' },
    { href: '#temoignages', label: 'Témoignages' },
  ];

  isMobileMenuOpen = false;

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.isMobileMenuOpen = false;
  }
}
