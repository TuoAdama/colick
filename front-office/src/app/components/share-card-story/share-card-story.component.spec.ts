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
      city: 'Abidjan',
      country: "Côte d'Ivoire",
      formattedDate: '14 juillet 2025',
      phone: '+33 6 00 00 00 00',
      email: 'ada@example.com',
      availableWeightLabel: '8 kg',
      pricePerKiloLabel: '10,00 € / kg',
    };
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Abidjan');
    expect(text).toContain("Côte d'Ivoire");
    expect(text).toContain('14 juillet 2025');
    expect(text).toContain('+33 6 00 00 00 00');
    expect(text).toContain('ada@example.com');
    expect(text).toContain('8 kg');
    expect(text).toContain('10,00 € / kg');
  });

  it('hides optional fields when missing', () => {
    component.data = {
      city: null,
      country: null,
      formattedDate: null,
      phone: null,
      email: null,
      availableWeightLabel: null,
      pricePerKiloLabel: null,
    };
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('Destination');
    expect(text).not.toContain('Date');
    expect(text).not.toContain('Téléphone');
    expect(text).not.toContain('Email');
    expect(text).not.toContain('Kg disponibles');
    expect(text).not.toContain('Prix / kg');
  });
});
