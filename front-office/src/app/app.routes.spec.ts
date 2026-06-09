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
});
