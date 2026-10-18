const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const dist = path.resolve(__dirname, '../../front-office/dist/front-office/browser');
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = path.join(dist, pathname === '/messages' ? 'index.csr.html' : pathname);
  try {
    res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch { res.statusCode = 404; res.end(); }
});
const conversations = [
  { id: 10, otherParticipantId: 2, otherParticipantName: 'Demsi Demsi', contextRoute: 'Nantes → Abidjan', lastMessage: 'Je n’ai plus de place désolé :)', unreadCount: 1 },
  { id: 11, otherParticipantId: 2, otherParticipantName: 'Demsi Demsi', contextRoute: 'Nantes → Rome', lastMessage: null, unreadCount: 0 },
  { id: 12, otherParticipantId: 3, otherParticipantName: 'Tuo Barah Ramatou', contextRoute: 'Nantes → Abidjan', lastMessage: 'Merci !!!', unreadCount: 0 },
].map(c => ({ ...c, createdAt: '2026-10-18T10:00:00' }));
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let mode = 'normal';
    await page.route('**/api/**', async route => {
      const pathname = new URL(route.request().url()).pathname;
      let body = {};
      if (pathname === '/api/auth/session') body = { id: 1, firstName: 'Adama', lastName: 'Tuo', email: 'demo@example.test', role: 'USER' };
      else if (pathname === '/api/public/app-config') body = { commercialMode: 'FREE', contentVariant: 'free', platformFeeRate: 0, features: {} };
      else if (pathname === '/api/messaging/conversations') {
        if (mode === 'error') { await route.fulfill({ status: 500, json: {} }); return; }
        body = mode === 'empty' ? [] : mode === 'long' ? Array.from({ length: 25 }, (_, i) => ({ ...conversations[i % 3], id: 10 + i, otherParticipantName: 'NomTrèsLongSansEspaces'.repeat(5), contextRoute: 'Saint-Sébastien-sur-Loire, France → Abidjan, Côte d’Ivoire', lastMessage: 'Un message très long '.repeat(30) })) : conversations;
      } else if (pathname.endsWith('/messages')) body = [{ id: 1, senderId: 2, senderName: 'Demsi', content: 'Bonjour', sentAt: '2026-10-18T10:00:00', read: true }];
      await route.fulfill({ json: body });
    });
    const url = `http://127.0.0.1:${server.address().port}/messages`;
    for (const width of [320, 390, 767, 768, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(url);
      await page.locator('.conversation-row').nth(2).waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`);
      if (width < 768) {
        assert.equal(await page.getByRole('searchbox').count(), 1);
        assert.equal(await page.locator('.conversation-count').textContent(), '3');
        assert.equal(await page.getByRole('button', { name: 'Retour', exact: true }).isVisible(), false);
        assert.equal(await page.locator('.conversation-unread').count(), 1);
        const panel = await page.locator('.messages-panel').evaluate(el => ({ radius: getComputedStyle(el).borderRadius, shadow: getComputedStyle(el).boxShadow }));
        assert.deepEqual(panel, { radius: '0px', shadow: 'none' });
        assert.equal(await page.locator('.conversation-list-heading').isVisible(), false);
      } else {
        assert.equal(await page.getByRole('searchbox').count(), 0);
        assert.equal(await page.locator('.conversation-list-heading').isVisible(), true);
        assert.equal(await page.locator('.conversation-indicators').first().isVisible(), false);
      }
      await page.screenshot({ path: path.join(__dirname, `list-${width}.png`), fullPage: true });
      console.log(`PASS layout ${width}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const search = page.getByRole('searchbox', { name: 'Rechercher une conversation' });
    await search.fill('DESOLE');
    await page.waitForFunction(() => document.querySelectorAll('.conversation-row').length === 1);
    assert.equal(await page.locator('.conversation-count').textContent(), '3');
    await search.fill('ROME');
    await page.waitForFunction(() => document.querySelectorAll('.conversation-row').length === 1);
    assert((await page.locator('.conversation-row').textContent()).includes('Démarrer la conversation'));
    await search.fill('absent');
    await page.getByRole('status').waitFor();
    await search.fill('');
    await page.locator('.conversation-row').first().click();
    await page.locator('.message-composer').waitFor();
    await page.getByRole('button', { name: 'Retour', exact: true }).click();
    await search.waitFor();
    mode = 'long';
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(url);
    await page.locator('.conversation-row').nth(24).waitFor({ state: 'attached' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator('.conversation-row').last().scrollIntoViewIfNeeded();
    assert(await page.locator('.conversation-row').last().isVisible());
    await page.locator('.conversation-rows').evaluate(el => el.scrollTop = 0);
    await page.screenshot({ path: path.join(__dirname, 'list-long-320.png'), fullPage: true });
    for (mode of ['empty', 'error']) {
      await page.goto(url);
      await page.getByText(mode === 'empty' ? 'Aucune conversation.' : 'Impossible de charger les conversations.', { exact: mode === 'empty' }).waitFor();
      assert.equal(await page.locator('.conversation-row').count(), 0);
    }
    assert.deepEqual(errors, []);
    console.log('PASS search, accents, count, draft, unread marker, navigation, long content, scroll, empty/error, no browser errors');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
