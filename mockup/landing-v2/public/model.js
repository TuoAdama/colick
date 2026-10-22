export const DEFAULT_APP_ORIGIN = 'http://localhost:4200';

export function searchUrl(state, origin = DEFAULT_APP_ORIGIN) {
  const from = state.departure?.name || state.departureQuery.trim();
  const to = state.destination?.name || state.destinationQuery.trim();
  if (!from || !to) return null;
  const url = new URL(state.mode === 'transport' ? '/parcel-search' : '/search', origin);
  url.search = new URLSearchParams({ from, to, ...(state.date ? { date: state.date } : {}) });
  return url.href;
}

export function swapRoute(state) {
  return { ...state, departure: state.destination, destination: state.departure, departureQuery: state.destinationQuery, destinationQuery: state.departureQuery };
}

export function changeMode(state, mode) {
  return { ...state, mode: mode === 'transport' ? 'transport' : 'send' };
}

export function countryForTimezone(zone) {
  return ({ 'Europe/Paris': 'France', 'Europe/Brussels': 'Belgique', 'Europe/Rome': 'Italie', 'Europe/Madrid': 'Espagne', 'Europe/Berlin': 'Allemagne', 'Africa/Abidjan': "Côte d'Ivoire", 'Africa/Ouagadougou': 'Burkina Faso', 'Africa/Bamako': 'Mali', 'Africa/Conakry': 'Guinee', 'Africa/Dakar': 'Senegal', 'Africa/Porto-Novo': 'Benin', 'Africa/Douala': 'Cameroun', 'Africa/Casablanca': 'Maroc', 'Africa/Lome': 'Togo', 'Africa/Libreville': 'Gabon', 'Africa/Tunis': 'Tunisie', 'Africa/Algiers': 'Algerie', 'Africa/Brazzaville': 'Congo' })[zone];
}

export function feedUrl(zone) {
  const params = new URLSearchParams({ limit: '3' });
  const country = countryForTimezone(zone);
  if (country) params.set('country', country);
  return '/api/trips/landing-feed?' + params;
}

export function tripPresentation(trip, origin = DEFAULT_APP_ORIGIN) {
  const number = (n, digits) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits }).format(n);
  const weight = trip.availableWeight ?? trip.remainingWeight ?? trip.maxWeight ?? 0;
  const name = trip.travelerName || 'Voyageur';
  const bookingUrl = trip.reference ? new URL('/trips/ref/' + encodeURIComponent(trip.reference) + '/request', origin) : null;
  if (bookingUrl) bookingUrl.search = new URLSearchParams({ source: 'landing_recommended', returnUrl: '/' });
  const date = new Date(trip.departureTime);
  return {
    departure: trip.departureAddress,
    destination: trip.destination,
    price: number(trip.pricePerKilo, 0) + ' €',
    capacity: number(weight, 1) + ' kg libres',
    date: Number.isNaN(date.getTime()) ? 'Date à confirmer' : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
    name,
    initials: name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join(''),
    rating: trip.travelerRatingAverage == null ? 'Nouveau' : '★ ' + number(trip.travelerRatingAverage, 1),
    badge: trip.instantAcceptance ? 'Flash' : 'Disponible',
    profile: new URL('/travelers/' + encodeURIComponent(trip.travelerId), origin).href,
    booking: bookingUrl?.href,
  };
}

export async function fetchJson(url, { fetcher = fetch, timeout = 8000 } = {}) {
  const response = await fetcher(url, { signal: AbortSignal.timeout(timeout), credentials: 'omit' });
  if (!response.ok) throw new Error('API indisponible');
  return response.json();
}

export async function loadFeed(url, options) {
  try {
    const trips = await fetchJson(url, options);
    if (!Array.isArray(trips)) throw new Error('Réponse inattendue');
    return { status: trips.length ? 'success' : 'empty', trips: trips.slice(0, 3) };
  } catch {
    return { status: 'error', trips: [] };
  }
}

// Invalidate immediately, including during the debounce interval or after a swap.
export function createAutocomplete({ request, onUpdate, delay = 250 }) {
  let revision = 0;
  let timer;
  return {
    cancel() { revision++; clearTimeout(timer); },
    search(value) {
      const current = ++revision;
      clearTimeout(timer);
      const query = value.trim();
      onUpdate({ loading: false, suggestions: [], failed: false });
      if (query.length < 2) return;
      timer = setTimeout(async () => {
        onUpdate({ loading: true, suggestions: [], failed: false });
        try {
          const suggestions = await request(query);
          if (current === revision) onUpdate({ loading: false, suggestions: Array.isArray(suggestions) ? suggestions : [], failed: false });
        } catch {
          if (current === revision) onUpdate({ loading: false, suggestions: [], failed: true });
        }
      }, delay);
    },
  };
}
