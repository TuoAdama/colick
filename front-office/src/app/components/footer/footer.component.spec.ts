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

  it('renders the Coli-accented brand logo without a trailing dot', () => {
    const logo = fixture.nativeElement.querySelector('a[routerLink="/"]') as HTMLAnchorElement | null;
    const accentPart = logo?.querySelector('.text-accent') as HTMLElement | null;

    expect(logo?.textContent?.trim()).toBe('Coliclic');
    expect(accentPart?.textContent).toBe('Coli');
    expect(accentPart?.classList.contains('text-accent')).toBeTrue();
  });
});
