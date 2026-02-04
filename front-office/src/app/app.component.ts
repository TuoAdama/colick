import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { HeroComponent } from './components/hero/hero.component';
import { StatsComponent } from './components/stats/stats.component';
import { HowItWorksComponent } from './components/how-it-works/how-it-works.component';
import { AdvantagesComponent } from './components/advantages/advantages.component';
import { SecurityComponent } from './components/security/security.component';
import { TestimonialsComponent } from './components/testimonials/testimonials.component';
import { CtaComponent } from './components/cta/cta.component';
import { FooterComponent } from './components/footer/footer.component';

/**
 * AppComponent - Root component for the Colick front-office application.
 * Assembles all landing page sections into a complete page.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    HeroComponent,
    StatsComponent,
    HowItWorksComponent,
    AdvantagesComponent,
    SecurityComponent,
    TestimonialsComponent,
    CtaComponent,
    FooterComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  /**
   * Application title
   */
  title = 'Colick - Envoyez vos colis avec des voyageurs de confiance';
}
