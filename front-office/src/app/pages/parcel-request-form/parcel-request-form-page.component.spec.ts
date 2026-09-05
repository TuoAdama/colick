import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LocationService } from '../../services/location.service';
import { ParcelRequestService } from '../../services/parcel-request.service';
import { ParcelRequestFormPageComponent } from './parcel-request-form-page.component';

describe('ParcelRequestFormPageComponent', () => {
  let fixture: ComponentFixture<ParcelRequestFormPageComponent>;
  let component: ParcelRequestFormPageComponent;
  let router: Router;

  const parcelRequestServiceMock = {
    createRequest: jasmine.createSpy('createRequest').and.returnValue(of({ id: 1 })),
    uploadPhoto: jasmine.createSpy('uploadPhoto').and.returnValue(of({ id: 1 })),
  };

  const locationServiceMock = {
    searchLocations: jasmine.createSpy('searchLocations').and.returnValue(of([])),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParcelRequestFormPageComponent],
      providers: [
        provideRouter([]),
        { provide: ParcelRequestService, useValue: parcelRequestServiceMock },
        { provide: LocationService, useValue: locationServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({
                from: 'Paris',
                to: 'Abidjan',
                date: '2026-07-01',
              }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ParcelRequestFormPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    parcelRequestServiceMock.createRequest.calls.reset();
    parcelRequestServiceMock.createRequest.and.returnValue(of({ id: 1 }));
    parcelRequestServiceMock.uploadPhoto.calls.reset();
    parcelRequestServiceMock.uploadPhoto.and.returnValue(of({ id: 1 }));
  });

  it('prefills route fields from search query params', () => {
    fixture.detectChanges();

    expect(component.departureQuery).toBe('Paris');
    expect(component.destinationQuery).toBe('Abidjan');
    expect(component.desiredDate).toBe('2026-07-01');
    expect(component.departure?.name).toBe('Paris');
    expect(component.destination?.name).toBe('Abidjan');
  });

  it('uses the needs wording in the form title and submit action', () => {
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const submitButton = host.querySelector<HTMLButtonElement>('button[type="submit"]');

    expect(host.querySelector('h1')?.textContent?.trim()).toBe('Publier un besoin d’envoi');
    expect(submitButton?.textContent?.trim()).toBe('Publier mon besoin');
  });

  it('creates a parcel request and redirects to my publications', () => {
    fixture.detectChanges();
    component.packageTitle = 'Documents';
    component.weight = 2;
    component.description = 'Fragile';

    component.submit();

    expect(parcelRequestServiceMock.createRequest).toHaveBeenCalledWith({
      departure: 'Paris',
      destination: 'Abidjan',
      desiredDate: '2026-07-01',
      packageTitle: 'Documents',
      weight: 2,
      description: 'Fragile',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/parcel-requests'], { queryParams: { tab: 'mine' } });
  });

  it('uploads a selected photo after creation', () => {
    fixture.detectChanges();
    component.packageTitle = 'Documents';
    component.weight = 2;
    component.selectedPhotoFile = new File(['x'], 'box.png', { type: 'image/png' });

    component.submit();

    expect(parcelRequestServiceMock.uploadPhoto).toHaveBeenCalledWith(1, component.selectedPhotoFile);
    expect(router.navigate).toHaveBeenCalledWith(['/parcel-requests'], { queryParams: { tab: 'mine' } });
  });

  it('shows an error when creation fails', () => {
    parcelRequestServiceMock.createRequest.and.returnValue(throwError(() => new Error('failed')));
    fixture.detectChanges();
    component.packageTitle = 'Documents';
    component.weight = 2;

    component.submit();

    expect(component.errorMessage).toContain('Impossible de publier');
    expect(component.isSubmitting).toBeFalse();
  });
});
