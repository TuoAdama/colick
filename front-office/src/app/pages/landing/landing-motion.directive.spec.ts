import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LandingParallaxDirective, LandingRevealDirective } from './landing-motion.directive';

@Component({
  standalone: true,
  imports: [LandingRevealDirective, LandingParallaxDirective],
  template: '<section class="hero"><div appLandingParallax><img alt="Test"></div><article appLandingReveal><a href="#">Profil</a></article></section>',
})
class MotionHost {}

describe('Landing motion directives', () => {
  let reduced: boolean;
  let desktop: boolean;
  let preferenceChanged: () => void;
  let desktopChanged: () => void;
  let callback: IntersectionObserverCallback;
  let disconnect: jasmine.Spy;
  let raf: jasmine.Spy;
  let frame: FrameRequestCallback;
  let preferenceRemove: jasmine.Spy;

  beforeEach(() => {
    reduced = false; desktop = true;
    preferenceRemove = jasmine.createSpy('remove preference listener');
    spyOn(window, 'matchMedia').and.callFake(query => ({
      get matches() { return query.includes('reduced-motion') ? reduced : desktop; },
      addEventListener: (_type: string, fn: () => void) => { if (query.includes('reduced-motion')) preferenceChanged = fn; else desktopChanged = fn; },
      removeEventListener: preferenceRemove,
    } as unknown as MediaQueryList));
    disconnect = jasmine.createSpy('disconnect');
    spyOn(window, 'IntersectionObserver').and.callFake(function (fn: IntersectionObserverCallback) {
      callback = fn;
      return { observe: () => {}, unobserve: () => {}, disconnect } as unknown as IntersectionObserver;
    });
    raf = spyOn(window, 'requestAnimationFrame').and.callFake(fn => { frame = fn; return 1; });
    spyOn(window, 'cancelAnimationFrame');
    TestBed.configureTestingModule({ imports: [MotionHost] });
  });

  function render() {
    const fixture = TestBed.createComponent(MotionHost);
    const article = fixture.nativeElement.querySelector('article') as HTMLElement;
    spyOn(article, 'getBoundingClientRect').and.returnValue({ top: 2000 } as DOMRect);
    fixture.detectChanges();
    return { fixture, article, photo: fixture.nativeElement.querySelector('img') as HTMLImageElement };
  }

  it('reveals cards on scroll and keyboard focus, and disconnects on route exit', () => {
    const { fixture, article } = render();
    expect(article.classList.contains('scroll-reveal')).toBeTrue();
    callback([{ target: article, isIntersecting: true } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(article.classList.contains('is-revealed')).toBeTrue();
    callback([{ target: article, isIntersecting: false, boundingClientRect: { top: 2000 } } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(article.classList.contains('is-revealed')).toBeFalse();
    article.dispatchEvent(new FocusEvent('focusin'));
    expect(article.classList.contains('is-revealed')).toBeTrue();
    fixture.destroy();
    expect(disconnect).toHaveBeenCalled();
    expect(preferenceRemove).toHaveBeenCalled();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
  });

  it('keeps cards visible and schedules no parallax with reduced motion', () => {
    reduced = true;
    const { fixture, article } = render();
    expect(article.classList.contains('scroll-reveal')).toBeFalse();
    expect(raf).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('clears desktop parallax immediately when the viewport becomes a tablet', () => {
    const { fixture, photo } = render();
    frame(0);
    expect(photo.style.getPropertyValue('--photo-zoom')).toBe('1.02');
    desktop = false; desktopChanged();
    expect(photo.style.getPropertyValue('--photo-zoom')).toBe('');
    fixture.destroy();
  });

  it('keeps visible cards visible when reduced motion changes during a visit', () => {
    const { fixture, article } = render();
    reduced = true; preferenceChanged();
    expect(article.classList.contains('scroll-reveal')).toBeFalse();
    fixture.destroy();
  });
});
