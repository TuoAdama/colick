import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TripService } from './trip.service';

describe('TripService', () => {
  let service: TripService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TripService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TripService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('calls complete trip endpoint', () => {
    service.completeTrip(12).subscribe();

    const req = httpMock.expectOne('/api/trips/12/complete');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('calls booking delivery confirmation endpoint with validation code', () => {
    service.confirmBookingDelivery(12, 34, { validationCode: '123456' }).subscribe();

    const req = httpMock.expectOne('/api/trips/12/bookings/34/deliver');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ validationCode: '123456' });
    req.flush({});
  });
});
