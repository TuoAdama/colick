import { DEFAULT_APP_ORIGIN, changeMode, createAutocomplete, feedUrl, fetchJson, loadFeed, searchUrl, swapRoute, tripPresentation } from './model.js';

const $ = selector => document.querySelector(selector);
const icon = name => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(svg.namespaceURI, 'use');
  use.setAttribute('href', '#i-' + name);
  svg.append(use);
  return svg;
};
const element = (tag, className, text) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

let appOrigin = DEFAULT_APP_ORIGIN;
try { appOrigin = (await fetchJson('/config.json')).appOrigin || DEFAULT_APP_ORIGIN; } catch { /* Default remains usable if config is temporarily unavailable. */ }
document.querySelectorAll('[data-app-path]').forEach(link => { link.href = new URL(link.dataset.appPath, appOrigin).href; });
document.querySelectorAll('.icon').forEach(svg => svg.setAttribute('aria-hidden', 'true'));
let state = { mode: new URLSearchParams(location.search).get('mode') === 'transport' ? 'transport' : 'send', departureQuery: '', destinationQuery: '', departure: null, destination: null, date: '' };

const menu = $('#mobile-menu');
const menuToggle = $('#menu-toggle');
function closeMenu() {
  menu.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Ouvrir le menu');
}
menuToggle.addEventListener('click', () => {
  menu.hidden = !menu.hidden;
  menuToggle.setAttribute('aria-expanded', String(!menu.hidden));
  menuToggle.setAttribute('aria-label', menu.hidden ? 'Ouvrir le menu' : 'Fermer le menu');
});
document.addEventListener('click', event => { if (!menu.contains(event.target) && !menuToggle.contains(event.target)) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { closeMenu(); menuToggle.focus(); } });
matchMedia('(min-width: 1024px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

function renderMode() {
  const sending = state.mode === 'send';
  document.querySelectorAll('[data-mode]').forEach(tab => {
    const active = tab.dataset.mode === state.mode;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  $('#search-panel').setAttribute('aria-labelledby', sending ? 'mode-send' : 'mode-transport');
  $('#submit-label').textContent = sending ? 'Trouver un voyageur' : 'Voir les demandes';
  $('#date-label').textContent = sending ? 'À partir du' : 'Date souhaitée';
  $('#date').setAttribute('aria-label', sending ? 'À partir du — date facultative' : 'Date souhaitée — date facultative');
  $('#publish-trip').hidden = sending;
}
document.querySelectorAll('[data-mode]').forEach((tab, index, tabs) => {
  tab.addEventListener('click', () => {
    state = changeMode(state, tab.dataset.mode);
    const url = new URL(location.href);
    if (state.mode === 'transport') url.searchParams.set('mode', 'transport');
    else url.searchParams.delete('mode');
    history.replaceState(null, '', url);
    renderMode();
  });
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[tabs.length - 1] : tabs[(index + 1) % tabs.length];
    next.click(); next.focus();
  });
});
renderMode();

const autocompletes = {};
for (const field of ['departure', 'destination']) {
  const input = $('#' + field);
  const list = $('#' + field + '-list');
  const status = $('#' + field + '-status');
  let suggestions = [];
  let selected = -1;
  function close() {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    selected = -1;
  }
  function highlight() {
    [...list.children].forEach((item, i) => item.setAttribute('aria-selected', String(i === selected)));
    if (selected >= 0) {
      input.setAttribute('aria-activedescendant', `${field}-option-${selected}`);
      list.children[selected]?.scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  }
  function choose(value) {
    autocompletes[field].cancel();
    state[field] = value;
    state[field + 'Query'] = `${value.name}, ${value.country}`;
    input.value = state[field + 'Query'];
    input.removeAttribute('aria-invalid');
    $('#form-error').textContent = '';
    status.textContent = '';
    suggestions = [];
    close();
    input.focus();
  }
  const controller = createAutocomplete({
    request: query => fetchJson('/api/locations/search?' + new URLSearchParams({ q: query })),
    onUpdate: update => {
      suggestions = update.suggestions;
      selected = -1;
      list.replaceChildren();
      for (const [index, value] of suggestions.entries()) {
        const option = element('li', '', `${value.name}, ${value.country}`);
        option.id = `${field}-option-${index}`;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        option.addEventListener('pointerdown', event => event.preventDefault());
        option.addEventListener('click', () => choose(value));
        list.append(option);
      }
      const open = suggestions.length > 0 && document.activeElement === input;
      list.hidden = !open;
      input.setAttribute('aria-expanded', String(open));
      input.removeAttribute('aria-activedescendant');
      status.textContent = update.loading ? 'Recherche…' : update.failed ? 'Suggestions indisponibles — saisie libre possible.' : '';
    },
  });
  autocompletes[field] = { cancel() { controller.cancel(); status.textContent = ''; list.replaceChildren(); suggestions = []; close(); } };
  input.addEventListener('input', () => {
    state[field] = null;
    state[field + 'Query'] = input.value;
    input.removeAttribute('aria-invalid');
    $('#form-error').textContent = '';
    controller.search(input.value);
  });
  input.addEventListener('focus', () => {
    if (suggestions.length) { list.hidden = false; input.setAttribute('aria-expanded', 'true'); }
  });
  input.addEventListener('blur', close);
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { close(); return; }
    if (event.key === 'Enter' && !list.hidden && selected >= 0) { event.preventDefault(); choose(suggestions[selected]); return; }
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && suggestions.length) {
      event.preventDefault();
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      selected = event.key === 'ArrowDown' ? (selected + 1) % suggestions.length : (selected - 1 + suggestions.length) % suggestions.length;
      highlight();
    }
  });
}
$('#swap').addEventListener('click', () => {
  Object.values(autocompletes).forEach(controller => controller.cancel());
  state = swapRoute(state);
  $('#departure').value = state.departureQuery;
  $('#destination').value = state.destinationQuery;
  ['departure', 'destination'].forEach(field => $('#' + field).removeAttribute('aria-invalid'));
  $('#form-error').textContent = '';
});
$('#date').addEventListener('input', event => { state.date = event.target.value; });
$('#search-form').addEventListener('submit', event => {
  event.preventDefault();
  const url = searchUrl(state, appOrigin);
  if (url) { location.assign(url); return; }
  const missing = ['departure', 'destination'].filter(field => !state[field + 'Query'].trim());
  missing.forEach(field => $('#' + field).setAttribute('aria-invalid', 'true'));
  $('#form-error').textContent = 'Renseignez une ville de départ et une ville d’arrivée.';
  $('#' + missing[0]).focus();
});

const feed = $('#trip-feed');
const feedStatus = $('#feed-status');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('reveal'); observer.unobserve(entry.target); }
}, { threshold: .08 }) : null;

function tripCard(data, index) {
  const trip = tripPresentation(data, appOrigin);
  const card = element('article', 'trip-card');
  card.style.setProperty('--delay', `${index * 90}ms`);
  if (trip.booking) {
    const link = element('a', 'trip-card-link');
    link.href = trip.booking;
    link.setAttribute('aria-label', `Réserver le trajet de ${trip.departure} vers ${trip.destination}`);
    card.append(link);
  }
  const top = element('div', 'trip-top');
  const price = element('p', 'trip-price', trip.price);
  price.append(element('span', 'trip-unit', ' / kg'));
  top.append(element('span', 'trip-badge', trip.badge), price);
  const route = element('div', 'trip-route');
  route.append(element('p', 'trip-city', trip.departure), element('p', 'trip-city', trip.destination));
  const date = element('p', 'trip-date');
  date.append(icon('calendar'), document.createTextNode(trip.date));
  const bottom = element('div', 'trip-bottom');
  const traveler = element('a', 'traveler');
  traveler.href = trip.profile;
  traveler.setAttribute('aria-label', 'Voir le profil de ' + trip.name);
  const identity = element('span', '');
  identity.append(element('span', 'traveler-name', trip.name), element('span', 'traveler-rating', trip.rating));
  traveler.append(element('span', 'avatar', trip.initials), identity);
  bottom.append(traveler, element('span', 'capacity', trip.capacity));
  card.append(top, route, date, bottom);
  if (observer && !reducedMotion.matches) observer.observe(card);
  return card;
}

async function refreshFeed() {
  observer?.disconnect();
  feed.replaceChildren();
  feed.setAttribute('aria-busy', 'true');
  feedStatus.textContent = 'Chargement des trajets recommandés.';
  for (let i = 0; i < 3; i++) {
    const skeleton = element('div', 'skeleton');
    skeleton.setAttribute('aria-hidden', 'true');
    for (let j = 0; j < 4; j++) skeleton.append(element('span', ''));
    feed.append(skeleton);
  }
  const result = await loadFeed(feedUrl(Intl.DateTimeFormat().resolvedOptions().timeZone));
  feed.replaceChildren();
  feed.setAttribute('aria-busy', 'false');
  if (result.status === 'success') {
    result.trips.forEach((trip, index) => feed.append(tripCard(trip, index)));
    feedStatus.textContent = `${result.trips.length} trajet${result.trips.length > 1 ? 's' : ''} disponible${result.trips.length > 1 ? 's' : ''}.`;
  } else {
    const message = result.status === 'empty' ? 'Aucun trajet disponible pour le moment.' : 'Les trajets sont momentanément indisponibles.';
    feedStatus.textContent = message;
    const panel = element('div', 'feed-message', message);
    if (result.status === 'error') {
      const retry = element('button', 'retry-button', 'Réessayer');
      retry.type = 'button';
      retry.addEventListener('click', refreshFeed);
      panel.append(retry);
    }
    feed.append(panel);
  }
}
void refreshFeed();
