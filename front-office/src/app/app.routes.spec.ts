import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

describe('app routes', () => {
  it('defines the trip completion route as a child of the layout route', () => {
    const layoutRoute = routes.find(
      (currentRoute) => currentRoute.path === '' && currentRoute.children
    );

    expect(layoutRoute).toBeDefined();

    const childRoute = layoutRoute!.children!.find(
      (currentRoute) => currentRoute.path === 'trips/:tripId/reservations/complete'
    );

    expect(childRoute).toBeDefined();
    expect(childRoute?.loadComponent).toBeDefined();
  });

  it('places the authenticated parcel detail route after creation', () => {
    const layout = routes.find(route => route.children?.some(child => child.path === 'parcel-requests'))!;
    const children = layout.children!;
    const creationIndex = children.findIndex(route => route.path === 'parcel-requests/new');
    const detailIndex = children.findIndex(route => route.path === 'parcel-requests/:id');
    expect(layout.canActivate?.length).toBeGreaterThan(0);
    expect(detailIndex).toBeGreaterThan(creationIndex);
    expect(children[detailIndex].loadComponent).toBeDefined();
  });

  it('defines a public 404 route and a wildcard redirect', () => {
    const notFoundRoute = routes.find((currentRoute) => currentRoute.path === '404');
    const wildcardRoute = routes.find((currentRoute) => currentRoute.path === '**');

    expect(notFoundRoute).toBeDefined();
    expect(notFoundRoute?.loadComponent).toBeDefined();
    expect(wildcardRoute).toEqual(jasmine.objectContaining({ redirectTo: '/404' }));
  });

  it('defines a lazy-loaded public how-it-works route', () => {
    const howItWorksRoute = routes.find((currentRoute) => currentRoute.path === 'comment-ca-marche');

    expect(howItWorksRoute).toBeDefined();
    expect(howItWorksRoute?.loadComponent).toBeDefined();
  });

  it('defines a lazy-loaded public contact route', () => {
    const contactRoute = routes.find((currentRoute) => currentRoute.path === 'contact');

    expect(contactRoute).toBeDefined();
    expect(contactRoute?.loadComponent).toBeDefined();
  });

  it('loads public trip details while keeping the request route authenticated', () => {
    const detail = routes.find(route => route.path === 'trips/ref/:reference');
    const request = routes.find(route => route.path === 'trips/ref/:reference/request');
    expect(detail?.loadComponent).toBeDefined();
    expect(detail?.redirectTo).toBeUndefined();
    expect(detail?.canActivate).toBeUndefined();
    expect(request?.canActivate?.length).toBeGreaterThan(0);
  });

  it('defines every public trust route with lazy loading and SEO metadata', () => {
    const publicTrustPaths = [
      'a-propos',
      'tarifs',
      'aide',
      'aide/reglement-du-transport',
      'cgu',
      'confidentialite',
      'mentions-legales',
      'securite',
      'annulation-litiges',
    ];

    for (const path of publicTrustPaths) {
      const route = routes.find((candidate) => candidate.path === path);
      expect(route).withContext(path).toBeDefined();
      expect(route?.loadComponent).withContext(path).toBeDefined();
      expect(route?.data?.['seo']?.title).withContext(path).toBeTruthy();
      expect(route?.data?.['seo']?.description).withContext(path).toBeTruthy();
    }
  });

  it('opens the transport payment help page directly without a session', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const url = '/aide/reglement-du-transport';
    const harness = await RouterTestingHarness.create(url);
    const page = harness.routeNativeElement;

    expect(TestBed.inject(Router).url).toBe(url);
    expect(page?.querySelector('h1')?.textContent).toBe('Comment régler le transport ?');
    expect(page?.querySelector('#reglement-direct p')?.textContent).toContain('Vous réglez le transport directement avec lui.');
    expect(page?.querySelector('#moyen-de-paiement p')?.textContent).toContain('Wero, un virement instantané ou PayPal');
    expect(page?.querySelector('#confirmation p')?.textContent).toContain('Le règlement reste à organiser entre vous.');
  });

  it('prevents indexing legal drafts until their mandatory information is validated', () => {
    for (const path of ['cgu', 'confidentialite', 'mentions-legales', 'annulation-litiges']) {
      const route = routes.find((candidate) => candidate.path === path);
      expect(route?.data?.['seo']?.index).withContext(path).toBeFalse();
    }
  });
});
