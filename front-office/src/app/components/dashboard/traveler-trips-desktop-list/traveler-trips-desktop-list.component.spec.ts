import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Trip } from '../../../models/trip.model';
import { TravelerTripsDesktopListComponent } from './traveler-trips-desktop-list.component';

describe('TravelerTripsDesktopListComponent', () => {
  let fixture: ComponentFixture<TravelerTripsDesktopListComponent>;
  let component: TravelerTripsDesktopListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelerTripsDesktopListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TravelerTripsDesktopListComponent);
    component = fixture.componentInstance;
    component.trips = [buildTrip()];
    component.tripBookingsMap = { 12: [{ id: 1 } as never, { id: 2 } as never] };
    component.selectedTripId = 12;
    fixture.detectChanges();
  });

  it('renders the desktop columns and booking count', () => {
    const textContent = fixture.nativeElement.textContent;

    expect(textContent).toContain('Voyage');
    expect(textContent).toContain('Départ');
    expect(textContent).toContain('Poids max');
    expect(textContent).toContain('Prix/kg');
    expect(textContent).toContain('Demandes');
    expect(textContent).toContain("Plus d'options");
    expect(textContent).toContain('2');
  });

  it('emits the selected trip id when a row is clicked', () => {
    spyOn(component.selectTrip, 'emit');

    const row = fixture.nativeElement.querySelector('[role="button"][tabindex="0"]') as HTMLDivElement;
    row.click();

    expect(component.selectTrip.emit).toHaveBeenCalledWith(12);
  });

  it('passes the exact actions to the options menu', () => {
    const toggleButton = fixture.nativeElement.querySelector('button[aria-haspopup="menu"]') as HTMLButtonElement;

    toggleButton.click();
    fixture.detectChanges();

    const menuItems = Array.from(
      fixture.nativeElement.querySelectorAll('button[role="menuitem"]')
    ) as HTMLButtonElement[];

    expect(menuItems.map((item) => item.textContent?.trim())).toEqual([
      'Télécharger la carte PNG',
      'Marqué effectué',
    ]);
  });
});

function buildTrip(): Trip {
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
    status: 'ACTIVE',
    availableWeight: 8,
  };
}
