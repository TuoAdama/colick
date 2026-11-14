import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
  });

  it('links the how-it-works entry to its dedicated page', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    const howItWorksLink = links.find((link) => link.textContent?.trim() === 'Comment ca marche');

    expect(howItWorksLink?.getAttribute('href')).toBe('/comment-ca-marche');
  });

  it('links the contact entry to the public contact page', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    const contactLink = links.find((link) => link.textContent?.trim() === 'Nous contacter');

    expect(contactLink?.getAttribute('href')).toBe('/contact');
  });

  it('links every trust page from the three navigation columns', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    const destinations = links.map((link) => link.getAttribute('href'));

    expect(destinations).toContain('/a-propos');
    expect(destinations).toContain('/tarifs');
    expect(destinations).toContain('/aide');
    expect(destinations).toContain('/securite');
    expect(destinations).toContain('/cgu');
    expect(destinations).toContain('/confidentialite');
    expect(destinations).toContain('/mentions-legales');
    expect(destinations).toContain('/annulation-litiges');
    expect(fixture.nativeElement.querySelectorAll('nav').length).toBe(3);
  });

  it('renders French as non-interactive text and has no placeholder links', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[aria-label="Langue actuelle : français"]')?.tagName).toBe('SPAN');
    expect(host.querySelector('a[href="#"]')).toBeNull();
  });

  it('renders the Coli-accented brand logo without a trailing dot', () => {
    const logo = fixture.nativeElement.querySelector('a[routerLink="/"]') as HTMLAnchorElement | null;
    const accentPart = logo?.querySelector('.text-accent') as HTMLElement | null;

    expect(logo?.textContent?.trim()).toBe('Coliclic');
    expect(accentPart?.textContent).toBe('Coli');
    expect(accentPart?.classList.contains('text-accent')).toBeTrue();
  });
});
