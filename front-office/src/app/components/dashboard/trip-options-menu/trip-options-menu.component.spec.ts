import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TripOptionsMenuComponent } from './trip-options-menu.component';

describe('TripOptionsMenuComponent', () => {
  let fixture: ComponentFixture<TripOptionsMenuComponent>;
  let component: TripOptionsMenuComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripOptionsMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TripOptionsMenuComponent);
    component = fixture.componentInstance;
    component.tripId = 12;
    component.tripLabel = 'Paris vers Abidjan';
    component.canDownload = true;
    component.canDelete = true;
    component.canComplete = true;
    component.canCancel = true;
    component.showDeleteOption = true;
    fixture.detectChanges();
  });

  it('opens the menu with the requested actions', () => {
    const toggleButton = fixture.nativeElement.querySelector('button[aria-haspopup="menu"]') as HTMLButtonElement;

    toggleButton.click();
    fixture.detectChanges();

    const menuItems = Array.from(
      fixture.nativeElement.querySelectorAll('button[role="menuitem"]')
    ) as HTMLButtonElement[];

    expect(menuItems.length).toBe(4);
    expect(menuItems[0].textContent).toContain('Télécharger la carte PNG');
    expect(menuItems[1].textContent).toContain('Supprimer le trajet');
    expect(menuItems[2].textContent).toContain('Annuler');
    expect(menuItems[3].textContent).toContain('Marquer comme terminé');
  });

  it('emits the trip id when downloading the PNG', () => {
    spyOn(component.downloadPng, 'emit');
    component.isOpen = true;
    fixture.detectChanges();

    const menuItems = fixture.nativeElement.querySelectorAll('button[role="menuitem"]') as NodeListOf<HTMLButtonElement>;
    menuItems[0].click();

    expect(component.downloadPng.emit).toHaveBeenCalledWith(12);
    expect(component.isOpen).toBeFalse();
  });

  it('does not emit completion when the action is disabled', () => {
    spyOn(component.completeTrip, 'emit');
    component.isOpen = true;
    component.canComplete = false;
    fixture.detectChanges();

    const menuItems = fixture.nativeElement.querySelectorAll('button[role="menuitem"]') as NodeListOf<HTMLButtonElement>;
    menuItems[3].click();

    expect(component.completeTrip.emit).not.toHaveBeenCalled();
  });

  it('emits the trip id when deleting the trip', () => {
    spyOn(component.deleteTrip, 'emit');
    component.isOpen = true;
    fixture.detectChanges();

    const menuItems = fixture.nativeElement.querySelectorAll('button[role="menuitem"]') as NodeListOf<HTMLButtonElement>;
    menuItems[1].click();

    expect(component.deleteTrip.emit).toHaveBeenCalledWith(12);
    expect(component.isOpen).toBeFalse();
  });

  it('shows and emits the optional cancel action when enabled', () => {
    spyOn(component.cancelTrip, 'emit');
    component.isOpen = true;
    fixture.detectChanges();

    const menuItems = fixture.nativeElement.querySelectorAll('button[role="menuitem"]') as NodeListOf<HTMLButtonElement>;
    menuItems[2].click();

    expect(menuItems.length).toBe(4);
    expect(menuItems[2].textContent).toContain('Annuler');
    expect(component.cancelTrip.emit).toHaveBeenCalledWith(12);
  });
});
