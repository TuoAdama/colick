import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { filter } from 'rxjs';

/**
 * AppComponent - Root component for the Coliclic front-office application.
 * Renders the shared header, router outlet, and footer.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly documentTitle = inject(Title);
  private readonly reservationShellRoutePattern = /^\/trips\/\d+\/reservations(?:\/[^?#]*)?(?:[?#].*)?$/;
  private readonly dashboardShellRoutePatterns = [
    /^\/dashboard(?:[?#].*)?$/,
    /^\/trips(?:\/[^?#]*)?(?:[?#].*)?$/,
    /^\/propose(?:\/[^?#]*)?(?:[?#].*)?$/,
    /^\/messages(?:[?#].*)?$/,
    /^\/settings(?:[?#].*)?$/,
    /^\/sent-bookings(?:\/[^?#]*)?(?:[?#].*)?$/,
  ];
  /**
   * Application title
   */
  title = 'Coliclic - Envoyez vos colis avec des voyageurs de confiance';
  showSharedChrome = true;

  constructor() {
    this.documentTitle.setTitle(this.title);
    this.updateSharedChrome(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateSharedChrome(event.urlAfterRedirects);
      });
  }

  private updateSharedChrome(url: string): void {
    this.showSharedChrome =
      !this.reservationShellRoutePattern.test(url) &&
      !this.dashboardShellRoutePatterns.some((pattern) => pattern.test(url));
  }
}
