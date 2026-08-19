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
      departureCountry: 'France',
      destinationCity: 'Abidjan',
      destinationCountry: "Côte d'Ivoire",
      routeLabel: 'Paris → Abidjan',
      formattedDateTime: '14 mars 2024 • 10:30',
      formattedDate: '14 Mars 2024',
      formattedTime: '10:30',
      formattedArrivalDate: '15 Mars 2024',
      formattedArrivalTime: '18:00',
      travelerName: 'Jean Dupont',
      phone: '+33 6 00 00 00 00',
      email: 'ada@example.com',
      availableWeightLabel: '12 kg',
      pricePerKiloLabel: '10,00 € / kg',
      shareUrlLabel: 'coliclic.test/trips/ref/TRP-2026-000001',
      qrCodeDataUrl: 'data:image/png;base64,qr',
      tripReference: 'TRP-2026-000001',
    };
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Trajet');
    expect(text).toContain('Disponible');
    expect(text).toContain('Paris');
    expect(text).toContain('France');
    expect(text).toContain('14 Mars 2024');
    expect(text).toContain('10:30');
    expect(text).toContain('15 Mars 2024');
    expect(text).toContain('18:00');
    expect(text).toContain('Jean Dupont');
    expect(text).toContain('12 kg');
    expect(text).toContain('10,00 € / kg');
    expect(text).toContain('Abidjan');
    expect(text).toContain("Côte d'Ivoire");
    expect(text).toContain('Lien direct');
    expect(text).toContain('coliclic.test/trips/ref/TRP-2026-000001');
    expect(text).toContain('TRP-2026-000001');
    expect(text).toContain('Coliclic');
    expect(text).not.toContain('Transaction sécurisée');
    expect(text).not.toContain('Prélèvement de 7%');
  });

  it('uses a fixed 9:16 export surface', () => {
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('section') as HTMLElement | null;

    expect(root?.className).toContain('h-[1920px]');
    expect(root?.className).toContain('w-[1080px]');
  });

  it('keeps the QR code block inside the fixed CTA panel', () => {
    component.data = {
      qrCodeDataUrl: 'data:image/png;base64,qr',
    };
    fixture.detectChanges();

    const qrImage = fixture.nativeElement.querySelector('img[alt="QR code de réservation"]') as HTMLImageElement | null;
    const qrBox = qrImage?.parentElement as HTMLElement | null;
    const ctaPanel = qrBox?.closest('section') as HTMLElement | null;

    expect(ctaPanel?.className).toContain('h-[360px]');
    expect(qrBox?.className).toContain('h-[200px]');
    expect(qrBox?.className).toContain('w-[200px]');
  });

  it('renders the full share URL without truncation styling', () => {
    component.data = {
      shareUrlLabel: 'https://coliclic.com/trips/ref/TRP-2026-000013',
      tripReference: 'TRP-2026-000013',
    };
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const urlElement = Array.from(host.querySelectorAll('p'))
      .find((element) => element.textContent?.includes('https://coliclic.com/trips/ref/TRP-2026-000013')) as HTMLElement | undefined;

    expect(host.textContent).toContain('https://coliclic.com/trips/ref/TRP-2026-000013');
    expect(host.textContent).toContain('TRP-2026-000013');
    expect(urlElement?.closest('section')?.textContent).toContain('Référence du trajet');
    expect(urlElement?.className).toContain('break-all');
    expect(urlElement?.className).not.toContain('truncate');
  });

  it('shows safe fallback values when optional fields are missing', () => {
    component.data = {
      departureCity: null,
      departureCountry: null,
      destinationCity: null,
      destinationCountry: null,
      routeLabel: null,
      formattedDateTime: null,
      formattedDate: null,
      formattedTime: null,
      formattedArrivalDate: null,
      formattedArrivalTime: null,
      travelerName: null,
      phone: null,
      email: null,
      availableWeightLabel: null,
      pricePerKiloLabel: null,
    };
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Trajet');
    expect(text).toContain('Disponible');
    expect(text).toContain('Départ');
    expect(text).toContain('Destination');
    expect(text).toContain('Date à confirmer');
    expect(text).toContain('--:--');
    expect(text).toContain('N/A kg');
    expect(text).toContain('N/A€ / kg');
    expect(text).toContain('Profil vérifié Coliclic');
    expect(text).not.toContain('ada@example.com');
    expect(text).not.toContain('+33 6 00 00 00 00');
  });
});
