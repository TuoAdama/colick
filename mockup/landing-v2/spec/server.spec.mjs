import http from 'node:http';
import { createPreviewServer } from '../server.mjs';

describe('Read-only preview server', () => {
  let upstream, preview, origin, calls;
  beforeEach(async () => {
    calls = [];
    upstream = http.createServer((req, res) => {
      calls.push({ path: req.url, cookie: req.headers.cookie });
      if (req.url.includes('slow')) return;
      res.setHeader('Content-Type', 'application/json');
      res.end(req.url.includes('empty') ? '[]' : '[{"id":2}]');
    });
    await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
    preview = createPreviewServer({ apiOrigin: `http://127.0.0.1:${upstream.address().port}`, timeout: 100 });
    await new Promise(resolve => preview.listen(0, '127.0.0.1', resolve));
    origin = `http://127.0.0.1:${preview.address().port}`;
  });
  afterEach(async () => {
    preview.closeAllConnections(); upstream.closeAllConnections();
    await Promise.all([new Promise(resolve => preview.close(resolve)), new Promise(resolve => upstream.close(resolve))]);
  });
  it('serves the independent page and app configuration', async () => {
    const page = await fetch(origin);
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('De main');
    expect(await (await fetch(origin + '/config.json')).json()).toEqual({ appOrigin: 'http://localhost:4200' });
    expect((await fetch(origin + '/server.mjs')).status).toBe(404);
  });
  it('proxies only the two public GET endpoints and strips cookies', async () => {
    const result = await fetch(origin + '/api/trips/landing-feed?limit=3&country=France', { headers: { Cookie: 'private=value' } });
    expect(await result.json()).toEqual([{ id: 2 }]);
    expect(calls[0]).toEqual({ path: '/api/trips/landing-feed?limit=3&country=France', cookie: undefined });
    expect((await fetch(origin + '/api/locations/search?q=Paris')).status).toBe(200);
    expect((await fetch(origin + '/api/trips')).status).toBe(404);
    expect((await fetch(origin + '/api/trips/landing-feed', { method: 'POST' })).status).toBe(405);
    expect(calls.length).toBe(2);
  });
  it('preserves empty results and returns a recoverable error on timeout', async () => {
    expect(await (await fetch(origin + '/api/trips/landing-feed?empty=1')).json()).toEqual([]);
    expect((await fetch(origin + '/api/trips/landing-feed?slow=1')).status).toBe(502);
  });
});
