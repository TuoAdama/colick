import { DOCUMENT } from '@angular/common';
import { Injectable, REQUEST, inject } from '@angular/core';
import { Meta, MetaDefinition, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { PREPROD_HOST } from '../seo.config';

export interface SeoRouteData {
  title: string;
  description: string;
  index?: boolean;
}

export interface SeoMetadata extends SeoRouteData {
  image?: string;
  type?: 'website' | 'article' | 'profile';
  structuredData?: Record<string, unknown>;
}

export const DEFAULT_SEO: SeoRouteData = {
  title: 'Coliclic - Envoyez vos colis avec des voyageurs de confiance',
  description: 'Coliclic met en relation expéditeurs et voyageurs pour transporter des colis.',
  index: false,
};

export const DEFAULT_OG_IMAGE = '/og-coliclic.png';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly request = inject(REQUEST, { optional: true });

  update(snapshot: ActivatedRouteSnapshot): void {
    const leaf = this.deepestChild(snapshot);
    const seo = (leaf.routeConfig?.data?.['seo'] as SeoMetadata | undefined) ?? DEFAULT_SEO;
    this.applyMetadata(seo, this.router.url, seo.index === true);
  }

  updateMetadata(seo: Omit<SeoMetadata, 'index'>, url = this.router.url): void {
    this.applyMetadata(seo, url, false);
  }

  private applyMetadata(seo: SeoMetadata, url: string, routeAllowsIndexing: boolean): void {
    this.title.setTitle(seo.title);
    this.meta.updateTag({ name: 'description', content: seo.description });
    const indexable = routeAllowsIndexing && !this.isPreprodHost();
    this.meta.updateTag({ name: 'robots', content: indexable ? 'index, follow' : 'noindex, nofollow' });
    const canonicalUrl = this.canonicalUrl(url);
    const imageUrl = new URL(seo.image ?? DEFAULT_OG_IMAGE, canonicalUrl).href;
    const tags: MetaDefinition[] = [
      { property: 'og:title', content: seo.title },
      { property: 'og:description', content: seo.description },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:type', content: seo.type ?? 'website' },
      { property: 'og:image', content: imageUrl },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: seo.title },
      { name: 'twitter:description', content: seo.description },
      { name: 'twitter:image', content: imageUrl },
    ];
    tags.forEach(tag => this.meta.updateTag(tag));
    this.updateCanonical(canonicalUrl);
    this.updateStructuredData(seo.structuredData);
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
    canonical.setAttribute('href', url);
  }

  private canonicalUrl(url: string): string {
    const canonical = new URL(url.split(/[?#]/)[0] || '/', this.request?.url ?? this.document.URL);
    canonical.pathname = canonical.pathname.replace(/\/+$/, '') || '/';
    return canonical.href;
  }

  private isPreprodHost(): boolean {
    const host = this.request?.headers.get('host')
      ?? (this.request ? new URL(this.request.url).host : this.document.location?.host);
    return host?.toLowerCase().split(':')[0] === PREPROD_HOST;
  }

  private updateStructuredData(data?: Record<string, unknown>): void {
    const existing = this.document.head.querySelector<HTMLScriptElement>('script[data-coliclic-structured-data]');
    if (existing) existing.remove();
    if (!data) return;
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-coliclic-structured-data', 'true');
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
    this.document.head.appendChild(script);
  }
}
