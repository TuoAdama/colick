import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HowItWorksPageComponent } from './how-it-works-page.component';

describe('HowItWorksPageComponent', () => {
  let fixture: ComponentFixture<HowItWorksPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HowItWorksPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HowItWorksPageComponent);
    fixture.detectChanges();
  });

  it('explains the platform role and both journeys', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Comment ça marche ?');
    expect(text).toContain('Le rôle de Coliclic');
    expect(text).toContain('Envoyer un colis');
    expect(text).toContain('Proposer un voyage');
    expect(text).toContain('commission Coliclic de 7 %');
  });

  it('offers calls to action for senders and travelers', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];

    expect(links.find((link) => link.textContent?.trim() === 'Trouver un voyageur')?.getAttribute('href')).toBe('/search');
    expect(links.find((link) => link.textContent?.trim() === 'Publier un trajet')?.getAttribute('href')).toBe('/propose');
  });
});
