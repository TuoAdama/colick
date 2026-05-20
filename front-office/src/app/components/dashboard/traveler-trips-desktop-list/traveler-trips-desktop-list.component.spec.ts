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

  it('renders the requested desktop columns and booking count', () => {
    const textContent = fixture.nativeElement.textContent;

    expect(textContent).toContain('Trajet');
    expect(textContent).toContain('Date');
    expect(textContent).toContain('Poids max');
    expect(textContent).toContain('Prix/kg');
    expect(textContent).toContain('Status');
    expect(textContent).toContain('Actions');
    expect(textContent).toContain('2');
  });

  it('emits the selected trip id from the view action and the trip id from the edit action', () => {
    spyOn(component.selectTrip, 'emit');
    spyOn(component.editTrip, 'emit');

    const viewButton = fixture.nativeElement.querySelector('button[aria-label="Voir les demandes pour ce trajet"]') as HTMLButtonElement;
    const editButton = fixture.nativeElement.querySelector('button[aria-label="Modifier ce trajet"]') as HTMLButtonElement;

    viewButton.click();
    editButton.click();

    expect(component.selectTrip.emit).toHaveBeenCalledWith(12);
    expect(component.editTrip.emit).toHaveBeenCalledWith(12);
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
      'Supprimer le trajet',
      'Annuler',
      'Marquer comme terminé',
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
