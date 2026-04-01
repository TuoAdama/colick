import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessagingService } from '../../services/messaging.service';
@Component({ selector: 'app-header', standalone: true, imports: [CommonModule, RouterLink, AsyncPipe], templateUrl: './header.component.html' })
export class HeaderComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly messagingService = inject(MessagingService);
  navLinks = [
    { href: '#comment-ca-marche', label: 'Comment ca marche' },
    { href: '#avantages', label: 'Avantages' },
    { href: '#securite', label: 'Securite' },
    { href: '#temoignages', label: 'Temoignages' },
  ];
  isMobileMenuOpen = false;
  ngOnInit(): void { if (this.authService.isLoggedIn()) { this.messagingService.refreshUnreadCount(); } }
  toggleMobileMenu(): void { this.isMobileMenuOpen = !this.isMobileMenuOpen; }
  logout(): void { this.authService.logout(); this.messagingService.resetUnreadCount(); this.isMobileMenuOpen = false; }
}
