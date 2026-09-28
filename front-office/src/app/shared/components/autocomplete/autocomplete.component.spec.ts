import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { Subject } from 'rxjs';
import { Location } from '../../../models/location.model';
import { LocationService } from '../../../services/location.service';
import { AutocompleteComponent } from './autocomplete.component';

describe('AutocompleteComponent', () => {
  let fixture: ComponentFixture<AutocompleteComponent>;
  let component: AutocompleteComponent;
  const locationServiceMock = {
    searchLocations: jasmine.createSpy('searchLocations'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutocompleteComponent],
      providers: [{ provide: LocationService, useValue: locationServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(AutocompleteComponent);
    component = fixture.componentInstance;
    locationServiceMock.searchLocations.calls.reset();
  });

  it('ignores a stale lookup after its query is replaced', fakeAsync(() => {
    const staleResults = new Subject<Location[]>();
    locationServiceMock.searchLocations.and.returnValue(staleResults);
    fixture.detectChanges();

    component.query = 'Paris';
    component.onInputChange();
    tick(300);
    component.initialQuery = 'Abidjan';
    component.ngOnChanges({ initialQuery: new SimpleChange('Paris', 'Abidjan', false) });
    staleResults.next([{ id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' }]);

    expect(component.suggestions).toEqual([]);
    expect(component.isOpen).toBeFalse();
    expect(component.isLoading).toBeFalse();
  }));
});
