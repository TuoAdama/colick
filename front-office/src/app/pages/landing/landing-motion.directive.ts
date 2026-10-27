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

@Directive({ selector: '[appLandingParallax]', standalone: true })
export class LandingParallaxDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);

  constructor() {
    afterNextRender(() => this.zone.runOutsideAngular(() => {
      const photo = this.element.querySelector('img');
      const hero = this.element.closest('.hero');
      const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
      const desktop = window.matchMedia('(min-width: 1024px)');
      let frame: number | null = null;
      const clear = () => {
        photo?.style.removeProperty('--photo-shift');
        photo?.style.removeProperty('--photo-zoom');
      };
      const update = () => {
        frame = null;
        if (preference.matches || !desktop.matches) { clear(); return; }
        const bounds = hero?.getBoundingClientRect();
        const progress = bounds ? Math.max(0, Math.min(1, -bounds.top / Math.max(bounds.height, 1))) : 0;
        photo?.style.setProperty('--photo-shift', `${-progress * 22}px`);
        photo?.style.setProperty('--photo-zoom', String(1.02 + progress * .08));
      };
      const schedule = () => {
        if (frame === null && !preference.matches && desktop.matches) frame = requestAnimationFrame(update);
      };
      const configure = () => {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
        clear(); schedule();
      };
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      preference.addEventListener('change', configure);
      desktop.addEventListener('change', configure);
      schedule();
      this.destroyRef.onDestroy(() => {
        if (frame !== null) cancelAnimationFrame(frame);
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
        preference.removeEventListener('change', configure);
        desktop.removeEventListener('change', configure);
        clear();
      });
    }));
  }
}
