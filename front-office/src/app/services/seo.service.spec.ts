import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { DEFAULT_SEO, SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let title: Title;
  let meta: Meta;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { url: '/cgu?source=footer' } }],
    });
    service = TestBed.inject(SeoService);
    title = TestBed.inject(Title);
    meta = TestBed.inject(Meta);
    document.head.querySelector('link[rel="canonical"]')?.remove();
  });

  it('updates title, description, robots and canonical from the deepest route', () => {
    const leaf = {
      data: {
        seo: {
          title: 'Conditions générales d’utilisation | Coliclic',
          description: 'Conditions applicables à Coliclic.',
          index: true,
        },
      },
      firstChild: null,
    } as unknown as ActivatedRouteSnapshot;
    const root = { data: {}, firstChild: leaf } as unknown as ActivatedRouteSnapshot;

    service.update(root);

    expect(title.getTitle()).toBe('Conditions générales d’utilisation | Coliclic');
    expect(meta.getTag('name="description"')?.content).toBe('Conditions applicables à Coliclic.');
    expect(meta.getTag('name="robots"')?.content).toBe('index, follow');
    expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href.endsWith('/cgu')).toBeTrue();
  });

  it('writes social metadata and structured data for a public detail page', () => {
    service.updateMetadata({
      title: 'Paris → Abidjan | Coliclic',
      description: 'Trajet public Coliclic.',
      type: 'article',
      structuredData: { '@type': 'Trip', name: 'Paris → Abidjan' },
    }, '/trips/ref/TRP-1?utm_source=share');

    expect(meta.getTag('property="og:title"')?.content).toBe('Paris → Abidjan | Coliclic');
    expect(meta.getTag('property="og:type"')?.content).toBe('article');
    expect(meta.getTag('name="twitter:card"')?.content).toBe('summary_large_image');
    expect(meta.getTag('property="og:url"')?.content.endsWith('/trips/ref/TRP-1')).toBeTrue();
    expect(meta.getTag('property="og:image"')?.content.endsWith('/og-coliclic.svg')).toBeTrue();
    expect(document.head.querySelector('script[data-coliclic-structured-data]')?.textContent).toContain('Paris → Abidjan');
  });

  it('restores default metadata when the destination has no SEO configuration', () => {
    service.update({ data: {}, firstChild: null } as unknown as ActivatedRouteSnapshot);

    expect(title.getTitle()).toBe(DEFAULT_SEO.title);
    expect(meta.getTag('name="description"')?.content).toBe(DEFAULT_SEO.description);
    expect(meta.getTag('name="robots"')?.content).toBe('index, follow');
    expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href.endsWith('/cgu')).toBeTrue();
  });
});
