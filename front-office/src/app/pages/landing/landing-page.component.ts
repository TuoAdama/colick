import { Component } from '@angular/core';
import { HeroComponent } from '../../components/hero/hero.component';
import { StatsComponent } from '../../components/stats/stats.component';
import { HowItWorksComponent } from '../../components/how-it-works/how-it-works.component';
import { AdvantagesComponent } from '../../components/advantages/advantages.component';
import { SecurityComponent } from '../../components/security/security.component';
import { TestimonialsComponent } from '../../components/testimonials/testimonials.component';
import { CtaComponent } from '../../components/cta/cta.component';

/**
 * LandingPageComponent - Assembles all landing page sections.
 * This is the main entry point for the '/' route.
 */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    HeroComponent,
    StatsComponent,
    HowItWorksComponent,
    AdvantagesComponent,
    SecurityComponent,
    TestimonialsComponent,
    CtaComponent,
  ],
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent {}
