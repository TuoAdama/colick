import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { after, before, test } from 'node:test';

const origin = 'https://coliclic.com';
const preprod = 'preprod.coliclic.com';
const publicPaths = ['/', '/comment-ca-marche', '/contact', '/tarifs', '/a-propos', '/aide', '/aide/reglement-du-transport', '/securite'];

let api;
let ssr;
const originalApiUrl = process.env.SSR_API_BASE_URL;

before(async () => {
  api = createServer((req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    res.setHeader('Content-Type', 'application/json');
    if (path === '/api/travelers/7/profile') {
      return res.end(JSON.stringify({
        travelerId: 7, displayName: 'Voyageuse SEO', emailVerified: true,
        memberSinceEstimated: false, completedTripCount: 3, reviewCount: 0, responseSampleSize: 0,
      }));
    }
    if (path === '/api/travelers/7/reviews') {
      return res.end(JSON.stringify({ content: [], totalPages: 0 }));
    }
    if (path === '/api/trips/catalog') {
      return res.end(JSON.stringify({ items: [], totalElements: 0, page: 0, size: 20, hasNext: false }));
    }
    if (path === '/api/public/app-config') {
      return res.end(JSON.stringify({ contactTurnstileSiteKey: 'contact-test-site-key' }));
    }
    res.writeHead(401).end('{}');
  }).listen(0, '127.0.0.1');
  await new Promise(resolve => api.once('listening', resolve));
  process.env.SSR_API_BASE_URL = `http://127.0.0.1:${api.address().port}/api`;
  const { default: app } = await import('../dist/front-office/server/server.mjs');
  ssr = app.listen(0, '127.0.0.1');
  await new Promise(resolve => ssr.once('listening', resolve));
});

after(async () => {
  await Promise.all([api, ssr].map(server => server && new Promise(resolve => server.close(resolve))));
  if (originalApiUrl === undefined) delete process.env.SSR_API_BASE_URL;
  else process.env.SSR_API_BASE_URL = originalApiUrl;
});

function get(path, host = 'coliclic.com') {
  return new Promise((resolve, reject) => {
    request({ hostname: '127.0.0.1', port: ssr.address().port, path, headers: {
      host, 'X-Forwarded-Proto': 'https',
    } }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      res.on('error', reject);
    }).on('error', reject).end();
  });
}

test('production SSR serves the responsive hero illustration on the landing page', async () => {
  for (const path of ['/', '/?illustration=4']) {
    const { status, body } = await get(path);
    assert.equal(status, 200);
    assert.match(body, /src="\/images\/landing-regard-complice-480\.webp"/);
    assert.match(body, /srcset="[^"]*landing-regard-complice-360\.webp 360w,[^"]*landing-regard-complice-880\.webp 880w"/);
  }
});

test('the landing page offers parcel search and serves the traveler illustration', async () => {
  const landing = await get('/');
  assert.equal(landing.status, 200);
  const section = landing.body.match(/<section\b[^>]*id="colis-a-transporter"[^>]*>[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  assert.match(section, /href="\/parcel-search"[^>]*>Trouver des colis<\/a>/);

  const search = await get('/parcel-search');
  assert.equal(search.status, 200);
  assert.match(search.body, /id="parcel-search-title"/);

  for (const width of [480, 960]) {
    const path = `/images/landing-traveler-parcel-${width}.webp`;
    assert.ok(section.includes(path), path);
    const image = await get(path);
    assert.equal(image.status, 200, path);
    assert.equal(image.headers['content-type'], 'image/webp', path);
  }
});

test('the launch pages render indexable HTML with distinct metadata and canonical URLs', async () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const path of publicPaths) {
    const { status, body } = await get(`${path}?utm_source=test`);
    assert.equal(status, 200, path);
    assert.match(body, /<meta name="robots" content="index, follow">/);
    assert.ok(body.includes(`<link rel="canonical" href="${origin}${path}">`), path);
    assert.match(body, /<h1\b[^>]*>\s*[^<]/);
    titles.add(body.match(/<title>([^<]+)<\/title>/)?.[1]);
    descriptions.add(body.match(/<meta name="description" content="([^"]+)">/)?.[1]);
    if (path === '/') {
      const schema = body.match(/<script type="application\/ld\+json" data-coliclic-structured-data="true">([^<]+)<\/script>/)?.[1];
      assert.deepEqual(JSON.parse(schema), {
        '@context': 'https://schema.org', '@type': 'WebSite', name: 'Coliclic', url: `${origin}/`,
      });
      assert.match(body, /href="\/search\?mode=all"/);
    }
    if (path === '/comment-ca-marche') {
      for (const link of ['/search?mode=all', '/propose', '/tarifs', '/securite']) {
        assert.ok(body.includes(`href="${link}"`), link);
      }
    }
  }
  assert.equal(titles.has(undefined), false);
  assert.equal(descriptions.has(undefined), false);
  assert.equal(titles.size, publicPaths.length);
  assert.equal(descriptions.size, publicPaths.length);
});

test('production advertises an XML sitemap containing exactly the canonical launch URLs', async () => {
  const robots = await get('/robots.txt');
  assert.equal(robots.status, 200);
  assert.match(robots.headers['content-type'], /^text\/plain/);
  assert.equal(robots.body, `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
  const sitemap = await get('/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers['content-type'], /^application\/xml/);
  assert.match(sitemap.body, /<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
  const urls = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(urls.sort(), publicPaths.map(path => `${origin}${path}`).sort());
});

test('unknown routes return 404 and operational pages render noindex', async () => {
  for (const path of ['/route-inconnue-seo', '/404']) {
    const response = await get(path);
    assert.equal(response.status, 404, path);
    assert.match(response.body, /<title>Page introuvable \| Coliclic<\/title>/);
    assert.match(response.body, /<meta name="robots" content="noindex, nofollow">/);
  }
  for (const path of ['/search?mode=all&departure=Paris', '/travelers/7', '/login', '/dashboard',
    '/admin/trips', '/admin/trips/7', '/admin/trips/7/bookings/4']) {
    const response = await get(path);
    assert.equal(response.status, 200, path);
    assert.match(response.body, /<meta name="robots" content="noindex, nofollow">/);
    if (path === '/travelers/7') assert.match(response.body, /<title>Voyageuse SEO \| Profil voyageur Coliclic<\/title>/);
  }
});

test('preprod serves the same public content with noindex and omits the sitemap', async () => {
  const { status, body } = await get('/', preprod);
  assert.equal(status, 200);
  assert.match(body, /<meta name="robots" content="noindex, nofollow">/);
  assert.equal((await get('/robots.txt', preprod)).body, 'User-agent: *\nAllow: /\n');
  assert.equal((await get('/sitemap.xml', preprod)).status, 404);
});

test('the dispute form renders on direct access without being indexed', async () => {
  const { status, body } = await get('/annulation-litiges/formulaire');
  assert.equal(status, 200);
  assert.match(body, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(body, /<h1[^>]*>Formulaire de litige<\/h1>/);
  assert.match(body, /id="contact-booking-reference"/);
  assert.doesNotMatch(body, /Vérification anti-spam/);
});

test('the contact form transfers the public key and waits for browser verification', async () => {
  const { status, body } = await get('/contact');
  assert.equal(status, 200);
  assert.match(body, /"contactTurnstileSiteKey":"contact-test-site-key"/);
  assert.match(body, /Vérification anti-spam en cours/);
  assert.match(body, /<button\b[^>]*type="submit"[^>]*disabled/);
  assert.doesNotMatch(body, /challenges\.cloudflare\.com\/turnstile/);
});

test('dispute administration pages are not indexed or cached', async () => {
  for (const path of ['/admin/disputes', '/admin/disputes/7?page=1']) {
    const { status, headers, body } = await get(path);
    assert.equal(status, 200, path);
    assert.match(headers['cache-control'], /private, no-store/);
    assert.match(body, /<meta name="robots" content="noindex, nofollow">/);
  }
});
