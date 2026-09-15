import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TRUST_DOCUMENTS } from './trust-documents';
import { TrustPageLayoutComponent } from './trust-page-layout.component';

describe('TrustPageLayoutComponent', () => {
  let fixture: ComponentFixture<TrustPageLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrustPageLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TrustPageLayoutComponent);
    fixture.componentRef.setInput('document', TRUST_DOCUMENTS.about);
    fixture.detectChanges();
  });

  it('renders the title, version, update date and anchored summary', () => {
    const host = fixture.nativeElement as HTMLElement;
    const summaryLinks = Array.from(host.querySelectorAll('nav[aria-label="Sommaire de la page"] a'));

    expect(host.querySelector('h1')?.textContent).toContain('À propos de Coliclic');
    expect(host.textContent).toContain('Version 1.0');
    expect(host.querySelector('time')?.getAttribute('datetime')).toBe('2026-09-14');
    expect(summaryLinks.length).toBe(TRUST_DOCUMENTS.about.sections.length);
    expect(summaryLinks[0].getAttribute('href')).toBe('#mission');
    expect(host.querySelector('#mission')?.classList.contains('scroll-mt-28')).toBeTrue();
  });

  it('provides navigation to associated documents', () => {
    const host = fixture.nativeElement as HTMLElement;
    const related = host.querySelector('nav[aria-label="Documents associés"]');

    expect(related).not.toBeNull();
    expect(related?.textContent).toContain('Sécurité');
  });
});
