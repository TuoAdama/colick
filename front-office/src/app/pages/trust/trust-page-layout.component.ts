import { ViewportScroller } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TrustDocument } from './trust-document.model';

@Component({
  selector: 'app-trust-page-layout',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './trust-page-layout.component.html',
})
export class TrustPageLayoutComponent {
  private readonly router = inject(Router);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly document = input.required<TrustDocument>();

  reScrollActiveSection(sectionId: string): void {
    if (this.router.parseUrl(this.router.url).fragment === sectionId) {
      this.viewportScroller.scrollToAnchor(sectionId);
    }
  }
}
