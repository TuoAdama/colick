import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { SeoService } from './seo.service';

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
});
