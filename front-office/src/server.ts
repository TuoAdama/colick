import { APP_BASE_HREF } from '@angular/common';
import { REQUEST } from '@angular/core';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();
const commonEngine = new CommonEngine();

// Traefik terminates TLS one hop before Node; trust its forwarded protocol so
// Angular renders absolute URLs with the public HTTPS origin.
app.set('trust proxy', 1);

app.get('/health', (_req, res) => {
  res.status(200).type('text/plain').send('ok');
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

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
      ],
    })
    .then((html) => {
      res.setHeader('Cache-Control', 'private, no-store');
      res.send(html);
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
