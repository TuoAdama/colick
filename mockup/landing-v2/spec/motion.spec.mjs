import { createScrollMotion } from '../public/motion.js';

function target() {
  const classes = new Set();
  const properties = new Map();
  return {
    classes, properties,
    classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)) },
    style: { setProperty: (name, value) => properties.set(name, value), removeProperty: name => properties.delete(name) },
    contains: value => value === 'focused-control',
  };
}

describe('Scroll motion accessibility and lifecycle', () => {
  let callback, observe, unobserve, disconnect, preference, desktop, root, view, title, photo, events, frameCallback;
  beforeEach(() => {
    events = {};
    title = target(); photo = target();
    preference = { matches: false, addEventListener: (_event, fn) => { events.preference = fn; }, removeEventListener: jasmine.createSpy() };
    desktop = { matches: true, addEventListener: (_event, fn) => { events.desktop = fn; }, removeEventListener: jasmine.createSpy() };
    observe = jasmine.createSpy('observe'); unobserve = jasmine.createSpy('unobserve'); disconnect = jasmine.createSpy('disconnect');
    view = {
      innerHeight: 800,
      matchMedia: query => query === '(prefers-reduced-motion: reduce)' ? preference : desktop,
      IntersectionObserver: class { constructor(fn) { callback = fn; } observe = observe; unobserve = unobserve; disconnect = disconnect; },
      addEventListener: (event, fn) => { events[event] = fn; },
      removeEventListener: jasmine.createSpy(),
      requestAnimationFrame: jasmine.createSpy('raf').and.callFake(fn => { frameCallback = fn; return 1; }),
      cancelAnimationFrame: jasmine.createSpy('cancel'),
    };
    root = {
      activeElement: null,
      querySelector: selector => selector === '.hero-title' ? title : selector === '.hero-photo img' ? photo : { getBoundingClientRect: () => ({ top: -200, height: 400 }) },
      addEventListener: (event, fn) => { events[event] = fn; },
      removeEventListener: jasmine.createSpy(),
    };
  });
  it('reveals dynamically loaded cards and resets them only below the viewport', () => {
    const motion = createScrollMotion({ root, view });
    const card = target(); motion.observe(card);
    expect(card.classes.has('scroll-reveal')).toBeTrue();
    expect(observe).toHaveBeenCalledWith(card);
    callback([{ target: card, isIntersecting: true }]);
    expect(card.classes.has('is-revealed')).toBeTrue();
    callback([{ target: card, isIntersecting: false, boundingClientRect: { top: -400 } }]);
    expect(card.classes.has('is-revealed')).toBeTrue();
    callback([{ target: card, isIntersecting: false, boundingClientRect: { top: 810 } }]);
    expect(card.classes.has('is-revealed')).toBeFalse();
    callback([{ target: card, isIntersecting: true }]);
    expect(card.classes.has('is-revealed')).toBeTrue();
    motion.unobserve(card);
    expect(unobserve).toHaveBeenCalledWith(card);
    motion.destroy();
  });
  it('reveals focused controls immediately and does not hide them on exit', () => {
    const motion = createScrollMotion({ root, view });
    const form = target(); motion.observe(form);
    events.focusin({ target: { closest: () => form } });
    expect(form.classes.has('is-revealed')).toBeTrue();
    root.activeElement = 'focused-control';
    callback([{ target: form, isIntersecting: false, boundingClientRect: { top: 810 } }]);
    expect(form.classes.has('is-revealed')).toBeTrue();
    motion.destroy();
  });
  it('shows everything without an observer or with reduced motion', () => {
    view.IntersectionObserver = undefined;
    const motion = createScrollMotion({ root, view });
    const form = target(); motion.observe(form);
    expect(form.classes.has('scroll-reveal')).toBeFalse();
    expect(view.requestAnimationFrame).not.toHaveBeenCalled();
    motion.destroy();
  });
  it('reacts immediately when reduced motion is enabled and cancels queued effects', () => {
    const motion = createScrollMotion({ root, view });
    const form = target(); motion.observe(form);
    preference.matches = true; events.preference();
    expect(form.classes.has('scroll-reveal')).toBeFalse();
    expect(view.cancelAnimationFrame).toHaveBeenCalledWith(1);
    expect(photo.properties.has('--photo-zoom')).toBeFalse();
    const count = view.requestAnimationFrame.calls.count();
    events.scroll(); expect(view.requestAnimationFrame.calls.count()).toBe(count);
    motion.destroy();
  });
  it('batches scroll updates into a frame and clears effects on teardown', () => {
    const motion = createScrollMotion({ root, view });
    events.scroll(); events.scroll();
    expect(view.requestAnimationFrame.calls.count()).toBe(1);
    frameCallback();
    expect(title.properties.size).toBe(0);
    expect(photo.properties.get('--photo-shift')).toBe('-11px');
    expect(Number(photo.properties.get('--photo-zoom'))).toBeCloseTo(1.06);
    motion.destroy();
    expect(title.properties.size).toBe(0);
    expect(photo.properties.size).toBe(0);
    expect(disconnect).toHaveBeenCalled();
  });
  it('never hides the title, subtitle, form or any field even if registered', () => {
    const motion = createScrollMotion({ root, view });
    const form = target(); form.matches = () => true;
    const heading = target(); heading.matches = () => true;
    const subtitle = target(); subtitle.matches = selector => selector.includes('.hero-subtitle');
    const input = target(); input.closest = () => form;
    [form, heading, subtitle, input].forEach(node => motion.observe(node));
    expect(observe).not.toHaveBeenCalled();
    expect(form.classes.size + heading.classes.size + input.classes.size).toBe(0);
    motion.destroy();
  });
  it('removes desktop parallax when switching to the mobile thumbnail', () => {
    const motion = createScrollMotion({ root, view });
    frameCallback();
    expect(photo.properties.has('--photo-zoom')).toBeTrue();
    desktop.matches = false;
    events.desktop();
    frameCallback();
    expect(photo.properties.size).toBe(0);
    expect(title.properties.size).toBe(0);
    motion.destroy();
  });
});
