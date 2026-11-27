import { afterNextRender, DestroyRef, Directive, ElementRef, inject, NgZone } from '@angular/core';

/** Browser-only progressive enhancement. SSR and reduced-motion content stays visible. */
@Directive({ selector: '[appLandingReveal]', standalone: true })
export class LandingRevealDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);

  constructor() {
    afterNextRender(() => this.zone.runOutsideAngular(() => {
      const element = this.element;
      const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
      const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting || element.contains(document.activeElement)) element.classList.add('is-revealed');
          else if (entry.boundingClientRect.top >= window.innerHeight - 24) element.classList.remove('is-revealed');
        }
      }, { rootMargin: '0px 0px -24px 0px' });
      const configure = () => {
        observer?.unobserve(element);
        element.classList.remove('scroll-reveal', 'is-revealed');
        if (!preference.matches && observer) {
          element.classList.add('scroll-reveal');
          if (element.getBoundingClientRect().top < window.innerHeight - 24) element.classList.add('is-revealed');
          observer.observe(element);
        }
      };
      const focus = () => element.classList.add('is-revealed');
      configure();
      preference.addEventListener('change', configure);
      element.addEventListener('focusin', focus);
      this.destroyRef.onDestroy(() => {
        observer?.disconnect();
        preference.removeEventListener('change', configure);
        element.removeEventListener('focusin', focus);
        element.classList.remove('scroll-reveal', 'is-revealed');
      });
    }));
  }
}
