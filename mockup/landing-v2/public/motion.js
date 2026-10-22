/** Progressive enhancement: everything remains visible without JavaScript/observer support. */
export function createScrollMotion({ root = document, view = window } = {}) {
  const preference = view.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = view.matchMedia('(min-width: 1024px)');
  const targets = new Set();
  const hero = root.querySelector('.hero');
  const photo = root.querySelector('.hero-photo img');
  let frame = null;
  const observer = view.IntersectionObserver ? new view.IntersectionObserver(entries => {
    for (const entry of entries) {
      // Keyboard focus must never land on an invisible control.
      const visible = preference.matches || entry.isIntersecting || entry.target.contains(root.activeElement);
      if (visible) entry.target.classList.add('is-revealed');
      // Reset below the viewport only: translating an element back down as it
      // exits above would make its intersection oscillate at the top edge.
      else if (entry.boundingClientRect.top >= view.innerHeight - 24) entry.target.classList.remove('is-revealed');
    }
  }, { threshold: 0, rootMargin: '0px 0px -24px 0px' }) : null;

  function updateParallax() {
    frame = null;
    if (!desktop.matches) {
      photo?.style.removeProperty('--photo-shift');
      photo?.style.removeProperty('--photo-zoom');
      return;
    }
    const bounds = hero?.getBoundingClientRect();
    const progress = bounds ? Math.max(0, Math.min(1, -bounds.top / Math.max(bounds.height, 1))) : 0;
    photo?.style.setProperty('--photo-shift', `${-progress * 22}px`);
    photo?.style.setProperty('--photo-zoom', String(1.02 + progress * .08));
  }
  function scroll() {
    if (!preference.matches && observer && frame === null) frame = view.requestAnimationFrame(updateParallax);
  }
  function configure(target) {
    observer?.unobserve(target);
    target.classList.remove('scroll-reveal', 'is-revealed');
    if (observer && !preference.matches) {
      target.classList.add('scroll-reveal');
      observer.observe(target);
    }
  }
  function preferenceChanged() {
    if (frame !== null) view.cancelAnimationFrame(frame);
    frame = null;
    photo?.style.removeProperty('--photo-shift');
    photo?.style.removeProperty('--photo-zoom');
    targets.forEach(configure);
    if (!preference.matches) scroll();
  }
  function focus(event) {
    const target = event.target.closest?.('.scroll-reveal');
    if (target) target.classList.add('is-revealed');
  }
  view.addEventListener('scroll', scroll, { passive: true });
  view.addEventListener('resize', scroll);
  preference.addEventListener('change', preferenceChanged);
  desktop.addEventListener('change', preferenceChanged);
  root.addEventListener('focusin', focus);
  scroll();
  return {
    observe(target) {
      // Primary tasks are immediately visible, even if accidentally registered.
      if (target.matches?.('.hero-title, .search-section') || target.closest?.('.search-section')) return;
      targets.add(target); configure(target);
    },
    unobserve(target) { targets.delete(target); observer?.unobserve(target); },
    destroy() {
      observer?.disconnect();
      view.removeEventListener('scroll', scroll);
      view.removeEventListener('resize', scroll);
      preference.removeEventListener('change', preferenceChanged);
      desktop.removeEventListener('change', preferenceChanged);
      root.removeEventListener('focusin', focus);
      if (frame !== null) view.cancelAnimationFrame(frame);
      targets.forEach(target => target.classList.remove('scroll-reveal', 'is-revealed'));
      photo?.style.removeProperty('--photo-shift');
      photo?.style.removeProperty('--photo-zoom');
    },
  };
}
