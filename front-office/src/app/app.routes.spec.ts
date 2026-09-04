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
});
