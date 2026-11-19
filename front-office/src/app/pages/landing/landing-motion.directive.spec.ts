import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LandingRevealDirective } from './landing-motion.directive';

@Component({
  standalone: true,
  imports: [LandingRevealDirective],
  template: '<article appLandingReveal><a href="#">Profil</a></article>',
})
class MotionHost {}

describe('LandingRevealDirective', () => {
  let reduced: boolean;
  let preferenceChanged: () => void;
  let callback: IntersectionObserverCallback;
  let disconnect: jasmine.Spy;
  let preferenceRemove: jasmine.Spy;

  beforeEach(() => {
    reduced = false;
    preferenceRemove = jasmine.createSpy('remove preference listener');
    spyOn(window, 'matchMedia').and.callFake(() => ({
      get matches() { return reduced; },
      addEventListener: (_type: string, fn: () => void) => { preferenceChanged = fn; },
      removeEventListener: preferenceRemove,
    } as unknown as MediaQueryList));
    disconnect = jasmine.createSpy('disconnect');
    spyOn(window, 'IntersectionObserver').and.callFake(function (fn: IntersectionObserverCallback) {
      callback = fn;
      return { observe: () => {}, unobserve: () => {}, disconnect } as unknown as IntersectionObserver;
    });
    TestBed.configureTestingModule({ imports: [MotionHost] });
  });

  function render() {
    const fixture = TestBed.createComponent(MotionHost);
    const article = fixture.nativeElement.querySelector('article') as HTMLElement;
    spyOn(article, 'getBoundingClientRect').and.returnValue({ top: 2000 } as DOMRect);
    fixture.detectChanges();
    return { fixture, article };
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
  });

  it('keeps cards visible with reduced motion', () => {
    reduced = true;
    const { fixture, article } = render();
    expect(article.classList.contains('scroll-reveal')).toBeFalse();
    fixture.destroy();
  });

  it('keeps visible cards visible when reduced motion changes during a visit', () => {
    const { fixture, article } = render();
    reduced = true; preferenceChanged();
    expect(article.classList.contains('scroll-reveal')).toBeFalse();
    fixture.destroy();
  });
});
