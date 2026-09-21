import { ViewportScroller } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { filter, firstValueFrom } from 'rxjs';
import { TRUST_DOCUMENTS } from './trust-documents';
import { TrustPageComponent } from './trust-page.component';

describe('TrustPageLayoutComponent', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([
        { path: 'a-propos', component: TrustPageComponent, data: { trustSlug: 'about' } },
        { path: 'cgu', component: TrustPageComponent, data: { trustSlug: 'terms' } },
      ])],
    }).compileComponents();

    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/a-propos', TrustPageComponent);
  });

  it('renders the title, version, update date and anchored summary', () => {
    const host = harness.routeNativeElement as HTMLElement;
    const summaryLinks = Array.from(host.querySelectorAll('nav[aria-label="Sommaire de la page"] a'));

    expect(host.querySelector('h1')?.textContent).toContain('À propos de Coliclic');
    expect(host.textContent).toContain('Version 1.0');
    expect(host.querySelector('time')?.getAttribute('datetime')).toBe('2026-09-14');
    expect(summaryLinks.length).toBe(TRUST_DOCUMENTS.about.sections.length);
    expect(summaryLinks[0].getAttribute('href')).toBe('/a-propos#mission');
    expect(host.querySelector('#mission')?.classList.contains('scroll-mt-28')).toBeTrue();
  });

  it('does not render the draft notice on the terms page', async () => {
    await harness.navigateByUrl('/cgu', TrustPageComponent);
    const host = harness.routeNativeElement as HTMLElement;

    expect(host.querySelector('aside[role="note"]')).toBeNull();
  });

  it('keeps the document route when navigating to a section', async () => {
    await harness.navigateByUrl('/cgu', TrustPageComponent);
    const host = harness.routeNativeElement as HTMLElement;
    const paymentLink = Array.from(host.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Sommaire de la page"] a'))
      .find((link) => link.textContent?.trim() === 'Tarifs et règlement');
    const router = TestBed.inject(Router);

    expect(paymentLink?.getAttribute('href')).toBe('/cgu#paiement');
    expect(host.querySelector('#paiement')).not.toBeNull();

    const navigationEnd = firstValueFrom(router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)));
    paymentLink?.click();
    await navigationEnd;

    expect(router.url).toBe('/cgu#paiement');
  });

  it('scrolls again when the selected section fragment is already active', async () => {
    await harness.navigateByUrl('/cgu#paiement', TrustPageComponent);
    const host = harness.routeNativeElement as HTMLElement;
    const paymentLink = Array.from(host.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Sommaire de la page"] a'))
      .find((link) => link.textContent?.trim() === 'Tarifs et règlement');
    const viewportScroller = TestBed.inject(ViewportScroller);
    const scrollToAnchor = spyOn(viewportScroller, 'scrollToAnchor');

    expect(paymentLink).toBeDefined();
    paymentLink?.click();

    expect(scrollToAnchor).toHaveBeenCalledWith('paiement');
    expect(TestBed.inject(Router).url).toBe('/cgu#paiement');
  });

  it('provides navigation to associated documents', () => {
    const host = harness.routeNativeElement as HTMLElement;
    const related = host.querySelector('nav[aria-label="Documents associés"]');

    expect(related).not.toBeNull();
    expect(related?.textContent).toContain('Sécurité');
  });
});
