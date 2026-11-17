import { ViewportScroller } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TrustDocument, TrustParagraphPart } from './trust-document.model';

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

  isText(value: unknown): value is string {
    return typeof value === 'string';
  }

  isStrongPart(value: TrustParagraphPart): value is { strong: string } {
    return typeof value === 'object' && value !== null && 'strong' in value;
  }

  isLinkPart(value: TrustParagraphPart): value is { link: { label: string; route: string } } {
    return typeof value === 'object'
      && value !== null
      && 'link' in value
      && typeof value.link === 'object'
      && value.link !== null
      && typeof value.link.label === 'string'
      && typeof value.link.route === 'string';
  }

  reScrollActiveSection(sectionId: string): void {
    if (this.router.parseUrl(this.router.url).fragment === sectionId) {
      this.viewportScroller.scrollToAnchor(sectionId);
    }
  }
}
