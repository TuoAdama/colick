import { routes } from './app.routes';

describe('app routes', () => {
  it('defines the trip completion route', () => {
    const route = routes.find((currentRoute) => currentRoute.path === 'trips/:tripId/reservations/complete');

    expect(route).toBeDefined();
    expect(route?.loadComponent).toBeDefined();
  });
});
