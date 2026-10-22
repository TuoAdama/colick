import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicRoot = resolve(dirname(fileURLToPath(import.meta.url)), 'public');
const allowedApi = new Set(['/api/trips/landing-feed', '/api/locations/search']);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

export function createPreviewServer({ apiOrigin = 'http://localhost:8080', appOrigin = 'http://localhost:4200', timeout = 8000 } = {}) {
  return http.createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    try {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/config.json') {
        response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        response.end(JSON.stringify({ appOrigin }));
        return;
      }
      if (url.pathname.startsWith('/api/')) {
        if (!allowedApi.has(url.pathname) || request.method !== 'GET') {
          response.writeHead(404).end();
          return;
        }
        try {
          // Public, read-only requests: never forward cookies or authentication headers.
          const upstream = await fetch(new URL(url.pathname + url.search, apiOrigin), { signal: AbortSignal.timeout(timeout), redirect: 'error' });
          const body = await upstream.text();
          response.writeHead(upstream.status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
          response.end(body);
        } catch {
          response.writeHead(502, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          response.end(JSON.stringify({ message: 'API indisponible' }));
        }
        return;
      }
      const path = resolve(publicRoot, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
      if (!path.startsWith(publicRoot + sep)) {
        response.writeHead(404).end();
        return;
      }
      const content = await readFile(path);
      response.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream' });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch {
      response.writeHead(404).end();
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4300);
  createPreviewServer({ apiOrigin: process.env.API_ORIGIN, appOrigin: process.env.APP_ORIGIN }).listen(port, '127.0.0.1', () => {
    console.log(`Coliclic preview: http://localhost:${port}`);
  });
}
