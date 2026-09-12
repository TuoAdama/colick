import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  /**
   * Commission rate displayed in the section
   */
  commissionRate = '7%';
}
