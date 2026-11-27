import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TripAlertService } from './trip-alert.service';

describe('TripAlertService', () => {
  let service: TripAlertService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TripAlertService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TripAlertService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates a trip alert', () => {
    const request = {
      departure: 'Paris',
      destination: 'Abidjan',
      date: '2026-06-20',
      sort: 'price_asc',
      minPrice: 5,
      maxPrice: 15,
    };

    service.createAlert(request).subscribe((alert) => {
      expect(alert.id).toBe(1);
      expect(alert.departure).toBe('Paris');
    });

    const req = httpMock.expectOne('/api/trip-alerts');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ id: 1, ...request, createdAt: '2026-06-16T10:00:00' });
  });

  it('loads my trip alerts', () => {
    service.getMyAlerts().subscribe((alerts) => {
      expect(alerts.length).toBe(1);
      expect(alerts[0].destination).toBe('Dakar');
    });

    const req = httpMock.expectOne('/api/trip-alerts/mine');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 2, departure: 'Lyon', destination: 'Dakar' }]);
  });

  it('deletes a trip alert', () => {
    service.deleteAlert(7).subscribe();

    const req = httpMock.expectOne('/api/trip-alerts/7');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
