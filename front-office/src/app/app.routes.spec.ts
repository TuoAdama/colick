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

  it('prevents indexing legal drafts until their mandatory information is validated', () => {
    for (const path of ['cgu', 'confidentialite', 'mentions-legales', 'annulation-litiges']) {
      const route = routes.find((candidate) => candidate.path === path);
      expect(route?.data?.['seo']?.index).withContext(path).toBeFalse();
    }
  });
});
