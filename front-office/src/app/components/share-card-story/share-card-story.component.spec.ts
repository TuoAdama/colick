import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShareCardStoryComponent } from './share-card-story.component';

describe('ShareCardStoryComponent', () => {
  let fixture: ComponentFixture<ShareCardStoryComponent>;
  let component: ShareCardStoryComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShareCardStoryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShareCardStoryComponent);
    component = fixture.componentInstance;
  });

  it('renders provided fields', () => {
    component.data = {
      departureCity: 'Paris',
      destinationCity: 'Abidjan',
      routeLabel: 'Paris → Abidjan',
      formattedDateTime: '14 mars 2024 • 10:30',
      formattedDate: '14 Mars 2024',
      formattedTime: '10:30',
      travelerName: 'Jean Dupont',
      phone: '+33 6 00 00 00 00',
      email: 'ada@example.com',
      availableWeightLabel: '12 kg',
      pricePerKiloLabel: '10,00 € / kg',
    };
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Paris → Abidjan');
    expect(text).toContain('14 Mars 2024');
    expect(text).toContain('• 10:30');
    expect(text).toContain('Jean Dupont');
    expect(text).toContain('12 kg');
    expect(text).toContain('10,00 € / kg');
    expect(text).toContain('Abidjan');
    expect(text).toContain('Colick');
  });

  it('shows safe fallback values when optional fields are missing', () => {
    component.data = {
      departureCity: null,
      destinationCity: null,
      routeLabel: null,
      formattedDateTime: null,
      formattedDate: null,
      formattedTime: null,
      travelerName: null,
      phone: null,
      email: null,
      availableWeightLabel: null,
      pricePerKiloLabel: null,
    };
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Voyage Colick');
    expect(text).toContain('Date à confirmer');
    expect(text).toContain('• --:--');
    expect(text).toContain('N/A kg');
    expect(text).toContain('N/A€ / kg');
    expect(text).toContain('Profil vérifié Colick');
    expect(text).not.toContain('ada@example.com');
    expect(text).not.toContain('+33 6 00 00 00 00');
  });
});
