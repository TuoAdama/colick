import { changeMode, createAutocomplete, countryForTimezone, feedUrl, fetchJson, loadFeed, searchUrl, swapRoute, tripPresentation } from '../public/model.js';

const state = () => ({ mode: 'send', departureQuery: 'Paris, France', destinationQuery: 'Abidjan', departure: { name: 'Paris' }, destination: null, date: '2026-12-21' });
const response = data => Promise.resolve({ ok: true, json: async () => data });

describe('Search behavior', () => {
  it('uses selected city names, free text and optional dates', () => {
    const url = new URL(searchUrl(state()));
    expect(url.origin).toBe('http://localhost:4200');
    expect(url.pathname).toBe('/search');
    expect(Object.fromEntries(url.searchParams)).toEqual({ from: 'Paris', to: 'Abidjan', date: '2026-12-21' });
    expect(new URL(searchUrl({ ...state(), date: '' })).searchParams.has('date')).toBeFalse();
  });
  it('blocks blank cities and routes transport searches to parcel search', () => {
    expect(searchUrl({ ...state(), destinationQuery: '  ' })).toBeNull();
    expect(searchUrl({ ...state(), departure: null, departureQuery: '  ' })).toBeNull();
  });
  it('preserves cities and dates when changing mode and swapping', () => {
    const original = state();
    const transport = changeMode(original, 'transport');
    expect(transport).toEqual({ ...original, mode: 'transport' });
    expect(new URL(searchUrl(transport)).pathname).toBe('/parcel-search');
    const swapped = swapRoute(transport);
    expect(swapped.departureQuery).toBe('Abidjan');
    expect(swapped.destinationQuery).toBe('Paris, France');
    expect(swapped.destination).toEqual({ name: 'Paris' });
    expect(swapped.date).toBe(original.date);
    expect(swapRoute(swapped)).toEqual(transport);
  });
});

describe('Recommendations', () => {
  it('adds only known countries and requests three trips', () => {
    expect(countryForTimezone('Europe/Paris')).toBe('France');
    expect(countryForTimezone('America/New_York')).toBeUndefined();
    expect(feedUrl('Europe/Paris')).toContain('limit=3&country=France');
    expect(feedUrl('unknown')).toBe('/api/trips/landing-feed?limit=3');
  });
  it('formats API fields and links without fabricating a rating or a reference', () => {
    const card = tripPresentation({ departureAddress: 'Nantes', destination: 'Abidjan', travelerName: 'Adama Tuo', travelerId: 1, pricePerKilo: 30, availableWeight: 0, maxWeight: 30, departureTime: '2026-12-21T10:30:00', instantAcceptance: false });
    expect(card.price).toBe('30 €');
    expect(card.capacity).toBe('0 kg libres');
    expect(card.initials).toBe('AT');
    expect(card.rating).toBe('Nouveau');
    expect(card.badge).toBe('Disponible');
    expect(card.date).toContain('2026');
    expect(card.booking).toBeUndefined();
    expect(card.profile).toBe('http://localhost:4200/travelers/1');
  });
  it('encodes booking links and supports weight fallback', () => {
    const card = tripPresentation({ reference: 'TRP-2026-1', travelerId: 4, travelerName: 'Alice', travelerRatingAverage: 4.8, pricePerKilo: 12, remainingWeight: 5.5, departureTime: '2026-12-21T10:30:00', instantAcceptance: true });
    const url = new URL(card.booking);
    expect(url.pathname).toBe('/trips/ref/TRP-2026-1/request');
    expect(Object.fromEntries(url.searchParams)).toEqual({ source: 'landing_recommended', returnUrl: '/' });
    expect(card.capacity).toBe('5,5 kg libres');
    expect(card.badge).toBe('Flash');
    expect(card.rating).toContain('4,8');
  });
  it('distinguishes successful, empty, malformed and unavailable feeds', async () => {
    expect(await loadFeed('/feed', { fetcher: () => response([{ id: 1 }]) })).toEqual({ status: 'success', trips: [{ id: 1 }] });
    expect(await loadFeed('/feed', { fetcher: () => response([]) })).toEqual({ status: 'empty', trips: [] });
    expect((await loadFeed('/feed', { fetcher: () => response({ error: true }) })).status).toBe('error');
    expect((await loadFeed('/feed', { fetcher: async () => { throw new Error('offline'); } })).status).toBe('error');
    expect((await loadFeed('/feed', { fetcher: () => response([1, 2, 3, 4]) })).trips).toEqual([1, 2, 3]);
  });
  it('rejects HTTP failures and times out stalled requests', async () => {
    await expectAsync(fetchJson('/feed', { fetcher: async () => ({ ok: false }) })).toBeRejected();
    const fetcher = (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason)));
    expect((await loadFeed('/feed', { timeout: 10, fetcher })).status).toBe('error');
  });
});

describe('Autocomplete concurrency', () => {
  let controller;
  let updates;
  let request;
  beforeEach(() => {
    jasmine.clock().install();
    updates = [];
    request = jasmine.createSpy('request').and.resolveTo([]);
    controller = createAutocomplete({ request, onUpdate: update => updates.push(update) });
  });
  afterEach(() => { controller.cancel(); jasmine.clock().uninstall(); });
  it('waits 250ms and requires two characters', async () => {
    controller.search('P'); jasmine.clock().tick(300);
    expect(request).not.toHaveBeenCalled();
    controller.search('Pa'); jasmine.clock().tick(249);
    expect(request).not.toHaveBeenCalled();
    jasmine.clock().tick(1); await Promise.resolve();
    expect(request).toHaveBeenCalledOnceWith('Pa');
  });
  it('rejects an old response even before the new debounce finishes', async () => {
    let finish;
    request.and.returnValue(new Promise(resolve => { finish = resolve; }));
    controller.search('Paris'); jasmine.clock().tick(250);
    controller.search('Nantes'); finish([{ name: 'Paris' }]);
    await Promise.resolve();
    expect(updates.at(-1).suggestions).toEqual([]);
  });
  it('invalidates pending responses on swap or selection', async () => {
    let finish;
    request.and.returnValue(new Promise(resolve => { finish = resolve; }));
    controller.search('Paris'); jasmine.clock().tick(250); controller.cancel();
    const count = updates.length;
    finish([{ name: 'Paris' }]); await Promise.resolve();
    expect(updates.length).toBe(count);
  });
  it('allows free input after an API error', async () => {
    request.and.rejectWith(new Error('offline'));
    controller.search('Paris'); jasmine.clock().tick(250); await Promise.resolve();
    expect(updates.at(-1)).toEqual({ loading: false, suggestions: [], failed: true });
  });
});
