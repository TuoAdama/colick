import { ViewportScroller } from '@angular/common';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { filter, firstValueFrom } from 'rxjs';
import { routes } from '../../app.routes';
import { FREE_APP_CONFIG, PublicAppConfig } from '../../models/app-config.model';
import { AppConfigService } from '../../services/app-config.service';
import { ContactService } from '../../services/contact.service';
import { TRUST_DOCUMENTS } from './trust-documents';
import { TrustPageComponent } from './trust-page.component';

describe('TrustPageLayoutComponent', () => {
  let harness: RouterTestingHarness;
  let config: ReturnType<typeof signal<PublicAppConfig>>;

  beforeEach(async () => {
    config = signal(FREE_APP_CONFIG);
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'a-propos', component: TrustPageComponent, data: { trustSlug: 'about' } },
          { path: 'aide/reglement-du-transport', component: TrustPageComponent, data: { trustSlug: 'transport-payment' } },
          { path: 'annulation-litiges', component: TrustPageComponent, data: { trustSlug: 'cancellation-disputes' } },
          routes.find(route => route.path === 'annulation-litiges/formulaire')!,
          { path: 'cgu', component: TrustPageComponent, data: { trustSlug: 'terms' } },
          { path: 'mentions-legales', component: TrustPageComponent, data: { trustSlug: 'legal-notice' } },
        ]),
        { provide: AppConfigService, useValue: { config } },
        { provide: ContactService, useValue: {} },
      ],
    }).compileComponents();

    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/a-propos', TrustPageComponent);
  });

  it('renders the title, update date and anchored summary without a version label', () => {
    const host = harness.routeNativeElement as HTMLElement;
    const summaryLinks = Array.from(host.querySelectorAll('nav[aria-label="Sommaire de la page"] a'));

    expect(host.querySelector('h1')?.textContent).toContain('À propos de Coliclic');
    expect(host.textContent).not.toContain('Version 1.0');
    expect(host.textContent).toContain('Mise à jour le');
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

  it('links the claims section to the dedicated public form and removes the warning', async () => {
    await harness.navigateByUrl('/annulation-litiges', TrustPageComponent);
    const host = harness.routeNativeElement as HTMLElement;
    const formLink = host.querySelector<HTMLAnchorElement>('#reclamation a');
    const router = TestBed.inject(Router);

    expect(host.querySelector('aside[role="note"]')).toBeNull();
    expect(host.textContent).not.toContain('avant toute mise en production');
    expect(host.querySelector('#reclamation')?.textContent).toContain('par e-mail');
    expect(formLink?.getAttribute('href')).toBe('/annulation-litiges/formulaire');

    const navigationEnd = firstValueFrom(router.events.pipe(filter(event => event instanceof NavigationEnd)));
    formLink!.click();
    await navigationEnd;
    harness.detectChanges();

    expect(router.url).toBe('/annulation-litiges/formulaire');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Formulaire de litige');
    expect(harness.routeNativeElement?.querySelector('#contact-subject')).toBeNull();
  });

  it('keeps the legal notice editor section free of address placeholders and guidance', async () => {
    await harness.navigateByUrl('/mentions-legales', TrustPageComponent);
    const host = harness.routeNativeElement as HTMLElement;
    const editorText = host.querySelector('#editeur')?.textContent ?? '';

    expect(host.querySelector('aside[role="note"]')).toBeNull();
    expect(editorText).not.toContain('à renseigner avant la mise en production');
    expect(editorText).not.toContain('à titre professionnel');
    expect(editorText).not.toContain('à titre non professionnel');
    expect(editorText).toContain('Coliclic est édité par Adama Tuo, personne physique.');
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

  it('documents that the delivery code is emailed to the sender account', () => {
    const helpText = TRUST_DOCUMENTS.help.sections.flatMap(section => section.paragraphs ?? []).join(' ');

    expect(helpText).toContain('envoyé par e-mail à l’adresse du compte de l’expéditeur');
    expect(helpText).toContain('Le contact du destinataire saisi dans la demande');
    expect(helpText).toContain('ne reçoit pas le code automatiquement');
  });

  it('shows commercial terms that match the active configuration', async () => {
    await harness.navigateByUrl('/cgu', TrustPageComponent);
    let host = harness.routeNativeElement as HTMLElement;
    let paymentText = host.querySelector('#paiement')?.textContent ?? '';

    expect(paymentText).toContain('Le voyageur fixe son prix au kilo');
    expect(paymentText).toContain('règlement est convenu directement entre les utilisateurs');
    expect(paymentText).not.toContain('frais applicables');

    config.set({
      ...FREE_APP_CONFIG,
      commercialMode: 'COMMISSION',
      platformFeeRate: 0.07,
      features: { platformPayment: true, platformFee: true },
      contentVariant: 'commission',
    });
    harness.detectChanges();
    host = harness.routeNativeElement as HTMLElement;
    paymentText = host.querySelector('#paiement')?.textContent ?? '';

    expect(paymentText).toContain('Le voyageur fixe son prix au kilo');
    expect(paymentText).toContain('frais applicables sont présentés lors de la réservation');
    expect(paymentText).not.toContain('règlement est convenu directement entre les utilisateurs');
    expect(paymentText).not.toMatch(/En mode gratuit|En mode commission/i);
  });

  it('adapts the role, reimbursement and transport payment documents to the active configuration', async () => {
    await harness.navigateByUrl('/a-propos', TrustPageComponent);
    let host = harness.routeNativeElement as HTMLElement;
    expect(host.querySelector('#role')?.textContent).toContain('règlement du transport est organisé directement');

    await harness.navigateByUrl('/annulation-litiges', TrustPageComponent);
    host = harness.routeNativeElement as HTMLElement;
    expect(host.querySelector('#remboursement')?.textContent).toContain('ne détient aucun fonds');

    await harness.navigateByUrl('/aide/reglement-du-transport', TrustPageComponent);
    host = harness.routeNativeElement as HTMLElement;
    expect(host.querySelector('#reglement-direct')?.textContent).toContain('Vous réglez le transport directement avec lui');
    expect(host.textContent).toContain('Wero');

    config.set({
      ...FREE_APP_CONFIG,
      commercialMode: 'COMMISSION',
      platformFeeRate: 0.07,
      features: { platformPayment: true, platformFee: true },
      contentVariant: 'commission',
    });
    await harness.navigateByUrl('/a-propos', TrustPageComponent);
    harness.detectChanges();
    host = harness.routeNativeElement as HTMLElement;
    expect(host.querySelector('#role')?.textContent).toContain('conditions affichées lors de la réservation');

    await harness.navigateByUrl('/annulation-litiges', TrustPageComponent);
    host = harness.routeNativeElement as HTMLElement;
    expect(host.querySelector('#remboursement')?.textContent).toContain('remboursement intégral du paiement et des frais de plateforme');
    expect(host.querySelector('#remboursement')?.textContent).not.toContain('ne détient aucun fonds');

    await harness.navigateByUrl('/aide/reglement-du-transport', TrustPageComponent);
    host = harness.routeNativeElement as HTMLElement;
    const paymentPageText = host.textContent ?? '';
    expect(paymentPageText).toContain('Le paiement est présenté comme géré par la plateforme');
    expect(paymentPageText).not.toContain('Vous réglez le transport directement avec lui');
    expect(paymentPageText).not.toContain('Wero');
    expect(paymentPageText).not.toMatch(/En mode gratuit|En mode commission/i);
  });
});
