import { APP_BASE_HREF } from '@angular/common';
import { REQUEST, RESPONSE_INIT } from '@angular/core';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { routes } from './app/app.routes';
import { PRODUCTION_ORIGIN } from './app/seo.config';
import bootstrap from './main.server';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();
const commonEngine = new CommonEngine();
const cspReportOnly = process.env['SSR_CSP_REPORT_ONLY']?.trim();
const productionHost = new URL(PRODUCTION_ORIGIN).hostname;
const sitemapEntries = routes
  .filter(route => route.path !== undefined && route.data?.['seo']?.index === true)
  .map(route => `  <url><loc>${PRODUCTION_ORIGIN}/${route.path}</loc></url>`)
  .join('\n');

// Traefik terminates TLS one hop before Node; trust its forwarded protocol so
// Angular renders absolute URLs with the public HTTPS origin.
app.set('trust proxy', 1);

app.get('/health', (_req, res) => {
  res.status(200).type('text/plain').send('ok');
});

app.get('/robots.txt', (req, res) => {
  const sitemap = req.get('host')?.toLowerCase() === productionHost
    ? `Sitemap: ${PRODUCTION_ORIGIN}/sitemap.xml\n`
    : '';
  res.type('text/plain').send(`User-agent: *\nAllow: /\n${sitemap}`);
});

app.get('/sitemap.xml', (req, res) => {
  if (req.get('host')?.toLowerCase() !== productionHost) {
    res.status(404).type('text/plain').send('Sitemap indisponible');
    return;
  }
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`);
});

/**
 * Serve static files from /browser
 */
app.get(
  '**',
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get('**', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;
  const response: ResponseInit = { status: 200 };

  const requestUrl = `${protocol}://${headers.host}${originalUrl}`;
  const webRequest = new Request(requestUrl, {
    headers: new Headers(
      Object.entries(headers)
        .filter((entry): entry is [string, string | string[]] => entry[1] !== undefined)
        .map(([name, value]) => [name, Array.isArray(value) ? value.join(', ') : value] as [string, string]),
    ),
  });

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: requestUrl,
      publicPath: browserDistFolder,
      providers: [
        { provide: APP_BASE_HREF, useValue: baseUrl },
        { provide: REQUEST, useValue: webRequest },
        { provide: RESPONSE_INIT, useValue: response },
      ],
    })
    .then((html) => {
      res.setHeader('Cache-Control', 'private, no-store');
      if (cspReportOnly) {
        res.setHeader('Content-Security-Policy-Report-Only', cspReportOnly);
      }
      res.status(response.status ?? 200).send(html);
    })
    .catch((err) => next(err));
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export default app;
