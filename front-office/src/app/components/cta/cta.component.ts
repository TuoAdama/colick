import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommercialContentService } from '../../services/commercial-content.service';

/**
 * CtaComponent - Final call-to-action section encouraging user registration.
 * Displays a prominent section with sign-up and search buttons.
 */
@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cta.component.html',
})
export class CtaComponent {
  readonly commercialContent = inject(CommercialContentService);
}
