import { Component, inject } from '@angular/core';
import { AsyncPipe, DOCUMENT } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { filter } from 'rxjs';
import { AuthService } from './services/auth.service';
import { SeoService } from './services/seo.service';
import { AnalyticsService } from './services/analytics.service';

/**
 * AppComponent - Root component for the Coliclic front-office application.
 * Renders the shared header, router outlet, and footer.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AsyncPipe, RouterLink, RouterLinkActive, RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  readonly authService = inject(AuthService);
  private readonly documentTitle = inject(Title);
  private readonly seo = inject(SeoService);
  readonly analytics = inject(AnalyticsService);
  private readonly reservationShellRoutePattern = /^\/trips\/\d+\/reservations(?:\/[^?#]*)?(?:[?#].*)?$/;
  private readonly publicTripReferenceRoutePattern = /^\/trips\/ref\/[^/?#]+(?:[?#].*)?$/;
  private readonly dashboardShellRoutePatterns = [
    /^\/dashboard(?:[?#].*)?$/,
    /^\/trips(?:\/[^?#]*)?(?:[?#].*)?$/,
    /^\/propose(?:\/[^?#]*)?(?:[?#].*)?$/,
    /^\/parcel-requests(?:\/[^?#]*)?(?:[?#].*)?$/,
    /^\/messages(?:[?#].*)?$/,
    /^\/alerts(?:[?#].*)?$/,
    /^\/settings(?:[?#].*)?$/,
    /^\/sent-bookings(?:\/[^?#]*)?(?:[?#].*)?$/,
  ];
  /**
   * Application title
   */
  title = 'Coliclic - Envoyez vos colis avec des voyageurs de confiance';
  showSharedChrome = true;
  showMobileBottomSearchNavigation = false;
  currentPagePath = '/';

  constructor() {
    this.documentTitle.setTitle(this.title);
    const initialSnapshot = this.router.routerState?.snapshot?.root;
    if (initialSnapshot) this.seo.update(initialSnapshot);
    this.updateSharedChrome(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateSharedChrome(event.urlAfterRedirects);
        const routeSnapshot = this.router.routerState?.snapshot?.root;
        if (routeSnapshot) this.seo.update(routeSnapshot);
      });
  }

  focusMainContent(): void {
    this.document.getElementById('main')?.focus({ preventScroll: true });
  }

  private updateSharedChrome(url: string): void {
    this.currentPagePath = url.split(/[?#]/, 1)[0] || '/';
    this.showSharedChrome =
      this.publicTripReferenceRoutePattern.test(url) ||
      (!this.reservationShellRoutePattern.test(url) &&
        !this.dashboardShellRoutePatterns.some((pattern) => pattern.test(url)));
    this.showMobileBottomSearchNavigation = /^\/search(?:[?#].*)?$/.test(url);
  }
}
