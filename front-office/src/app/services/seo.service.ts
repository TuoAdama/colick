import { DOCUMENT } from '@angular/common';
import { Injectable, REQUEST, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

export interface SeoRouteData {
  title: string;
  description: string;
  index?: boolean;
}

export const DEFAULT_SEO: SeoRouteData = {
  title: 'Coliclic - Envoyez vos colis avec des voyageurs de confiance',
  description: 'Coliclic met en relation expéditeurs et voyageurs pour transporter des colis.',
  index: true,
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly request = inject(REQUEST, { optional: true });

  update(snapshot: ActivatedRouteSnapshot): void {
    const leaf = this.deepestChild(snapshot);
    const seo = (leaf.data['seo'] as SeoRouteData | undefined) ?? DEFAULT_SEO;

    this.title.setTitle(seo.title);
    this.meta.updateTag({ name: 'description', content: seo.description });
    this.meta.updateTag({ name: 'robots', content: seo.index === false ? 'noindex, nofollow' : 'index, follow' });
    this.updateCanonical(this.router.url);
  }

  private deepestChild(snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let current = snapshot;
    while (current.firstChild) current = current.firstChild;
    return current;
  }

  private updateCanonical(url: string): void {
    let canonical = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      this.document.head.appendChild(canonical);
    }
    canonical.setAttribute(
      'href',
      new URL(url.split(/[?#]/)[0] || '/', this.request?.url ?? this.document.URL).href,
    );
  }
}
