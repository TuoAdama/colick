import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardReceivedMobileCardComponent } from './dashboard-received-mobile-card.component';

describe('DashboardReceivedMobileCardComponent', () => {
  let fixture: ComponentFixture<DashboardReceivedMobileCardComponent>;
  let component: DashboardReceivedMobileCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardReceivedMobileCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardReceivedMobileCardComponent);
    component = fixture.componentInstance;
    component.trip = buildTrip();
    component.bookingCount = 3;
    fixture.detectChanges();
  });

  it('renders the route with primary city labels and the truthful price-per-kilo block', () => {
    const textContent = fixture.nativeElement.textContent;

    expect(textContent).toContain('Paris');
    expect(textContent).toContain('Abidjan');
    expect(textContent).toContain('Prix / kg');
    expect(textContent).toContain('15 €');
    expect(textContent).toContain('8 kg disponibles');
  });

  it('falls back to max weight when the available weight is missing', () => {
    component.trip = {
      ...buildTrip(),
      maxWeight: 20,
      availableWeight: undefined as unknown as number,
    };
    fixture.detectChanges();

    expect(component.availableWeightLabel()).toBe('20 kg disponibles');
    expect(fixture.nativeElement.textContent).toContain('20 kg disponibles');
  });

  it('renders the booking counter with the proper pluralization', () => {
    expect(component.bookingCountLabel()).toBe('3 demandes');
    expect(fixture.nativeElement.textContent).toContain('3 demandes');
  });

  it('uses the expected trip status mapping', () => {
    expect(component.statusLabel('ACTIVE')).toBe('Actif');
    expect(component.statusLabel('COMPLETED')).toBe('Terminé');
    expect(component.statusLabel('CANCELLED')).toBe('Annulé');
  });

  it('emits the view and edit actions for an active trip', () => {
    spyOn(component.viewTrip, 'emit');
    spyOn(component.editTrip, 'emit');

    const viewButton = fixture.nativeElement.querySelector(
      'button[aria-label="Afficher les demandes de ce trajet"]'
    ) as HTMLButtonElement;
    const editButton = fixture.nativeElement.querySelector(
      'button[aria-label="Modifier ce trajet"]'
    ) as HTMLButtonElement;

    viewButton.click();
    editButton.click();

    expect(component.viewTrip.emit).toHaveBeenCalledWith(12);
    expect(component.editTrip.emit).toHaveBeenCalledWith(12);
  });

  it('does not emit the edit action when the trip is no longer active', () => {
    spyOn(component.editTrip, 'emit');
    component.trip = { ...buildTrip(), status: 'COMPLETED' };
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector(
      'button[aria-label="Modifier ce trajet"]'
    ) as HTMLButtonElement;
    editButton.click();

    expect(component.editTrip.emit).not.toHaveBeenCalled();
    expect(editButton.disabled).toBeTrue();
  });
});

function buildTrip() {
  return {
    id: 12,
    travelerId: 1,
    travelerName: 'Ada Lovelace',
    departureAddress: 'Paris, France',
    destination: "Abidjan, Côte d'Ivoire",
    departureTime: '2025-07-14T08:00:00',
    arrivalTime: '2025-07-14T16:00:00',
    maxWeight: 20,
    pricePerKilo: 15,
    instantAcceptance: true,
    status: 'ACTIVE' as const,
    availableWeight: 8,
  };
}
