import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShareCardStoryComponent } from './share-card-story.component';
import { ShareCardMapperService } from '../../services/share-card-mapper.service';
import { ShareCardExportService } from '../../services/share-card-export.service';
import { Trip } from '../../models/trip.model';

describe('ShareCardStoryComponent', () => {
  let fixture: ComponentFixture<ShareCardStoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ShareCardStoryComponent] }).compileComponents();
    fixture = TestBed.createComponent(ShareCardStoryComponent);
  });

  it('shows the essential trip data and omits the previous secondary copy', () => {
    fixture.componentRef.setInput('data', {
      departureCity: 'Nantes', destinationCity: 'Abidjan',
      formattedShortDate: '21 déc. 2026', formattedShortArrivalDate: '15 janv. 2027',
      formattedDate: '21 Décembre 2026', formattedTime: '10:30',
      travelerName: 'Adama Tuo', availableWeightLabel: '30 kg', pricePerKiloLabel: '30€ / kg',
      departureCountry: 'France', phone: '+33600000000', email: 'adama@example.com',
      tripReference: 'TRP-2026-000001', shareUrlLabel: 'https://example.com/trips/ref/TRP-2026-000001',
      qrCodeDataUrl: 'data:image/png;base64,qr',
    });
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent!;
    for (const value of ['Coliclic', 'Nantes', 'Abidjan', '21 déc. 2026', '15 janv. 2027', 'Adama Tuo', '30 kg', '30€ / kg', 'Voir l’annonce']) {
      expect(text).toContain(value);
    }
    for (const value of ['J’ai de la place', 'Voyageur vérifié', 'Support Coliclic', 'Référence du trajet', 'TRP-2026-000001', 'France', '10:30', 'adama@example.com', '+33600000000']) {
      expect(text).not.toContain(value);
    }
    expect(host.querySelector<HTMLImageElement>('.qr-code')?.getAttribute('src')).toBe('data:image/png;base64,qr');
  });

  it('keeps safe fallbacks and does not invent a QR code', () => {
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    for (const value of ['Départ', 'Destination', 'Date à confirmer', 'N/A kg', 'N/A € / kg', 'Voyageur Coliclic', 'QR code indisponible']) {
      expect(text).toContain(value);
    }
    expect(fixture.nativeElement.querySelector('.qr-code')).toBeNull();
  });

  it('supports existing full dates when compact dates are absent', () => {
    fixture.componentRef.setInput('data', { formattedDate: '21 Décembre 2026', formattedArrivalDate: '15 Janvier 2027' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('21 Décembre 2026');
    expect(fixture.nativeElement.textContent).toContain('15 Janvier 2027');
  });

  it('keeps long city names, prices and traveler names inside the poster', () => {
    fixture.componentRef.setInput('data', {
      departureCity: 'Saint-Germain-en-Laye', destinationCity: 'Clermont-Ferrand',
      formattedShortDate: '21 sept. 2026', formattedShortArrivalDate: '15 janv. 2027',
      travelerName: 'Alexandra Dupont de la Vallière', availableWeightLabel: '1 234,56 kg', pricePerKiloLabel: '1 234,56€ / kg',
    });
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const root = host.querySelector<HTMLElement>('[data-share-card-root]')!;
    expect(root.getBoundingClientRect().width).toBe(1080);
    expect(root.getBoundingClientRect().height).toBe(1920);
    for (const element of Array.from(host.querySelectorAll<HTMLElement>('.city, .metric-value, .traveler, .announcement-cta, .qr-block'))) {
      expect(element.scrollWidth).withContext(element.className).toBeLessThanOrEqual(element.clientWidth + 1);
      expect(element.getBoundingClientRect().bottom).toBeLessThan(root.getBoundingClientRect().bottom);
    }
    const footer = host.querySelector<HTMLElement>('.ticket-footer')!;
    const ticket = host.querySelector<HTMLElement>('.ticket')!;
    expect(footer.scrollHeight).toBeLessThanOrEqual(footer.clientHeight + 1);
    expect(footer.getBoundingClientRect().bottom).toBeLessThan(ticket.getBoundingClientRect().bottom);
    expect(host.textContent).toContain('Saint-Germain-en-Laye');
    expect(host.textContent).toContain('Clermont-Ferrand');
  });

  it('exports a mapped announcement with a real QR code as a 1080 × 1920 PNG', async () => {
    const mapper = TestBed.inject(ShareCardMapperService);
    const exporter = TestBed.inject(ShareCardExportService);
    const data = mapper.mapActiveTripToShareCard({
      id: 1, reference: 'TRP-2026-000001', departureAddress: 'Nantes, France',
      destination: 'Abidjan, Côte d’Ivoire', departureTime: '2026-12-21T10:30:00',
      arrivalTime: '2027-01-15T10:30:00', availableWeight: 30, pricePerKilo: 30,
    } as Trip, { firstName: 'Adama', lastName: 'Tuo', email: 'adama@example.com' }, { shareOrigin: 'https://coliclic.com' });
    data.qrCodeDataUrl = await exporter.generateQrCodeDataUrl(data.shareUrl!);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
    const file = await exporter.captureElementAsPngFile(fixture.nativeElement, 'annonce.png');
    expect(file.type).toBe('image/png');
    expect(file.size).toBeGreaterThan(10000);
    const bitmap = await createImageBitmap(file);
    expect(bitmap.width).toBe(1080);
    expect(bitmap.height).toBe(1920);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(bitmap, 0, 0);
    expect(Array.from(context.getImageData(0, 0, 1, 1).data)).toEqual([248, 245, 237, 255]);
    bitmap.close();
    expect(fixture.nativeElement.querySelector('.qr-code').src).toMatch(/^data:image\/png;base64,/);
  }, 30000);
});
