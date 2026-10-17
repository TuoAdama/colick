import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ParcelRequestService } from './parcel-request.service';

describe('ParcelRequestService', () => {
  let service: ParcelRequestService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ParcelRequestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates a parcel request and normalizes photo URLs', () => {
    service.createRequest({
      departure: 'Paris',
      destination: 'Abidjan',
      packageTitle: 'Documents',
      weight: 2,
    }).subscribe((request) => {
      expect(request.packagePhotoUrl).toBe('/api/uploads/box.png');
      expect(request.senderPhotoUrl).toBe('/api/uploads/alice.png');
    });

    const req = httpMock.expectOne('/api/parcel-requests');
    expect(req.request.method).toBe('POST');
    req.flush({
      id: 1,
      senderId: 10,
      senderName: 'Alice Sender',
      senderPhotoUrl: '/uploads/alice.png',
      departure: 'Paris',
      destination: 'Abidjan',
      packageTitle: 'Documents',
      weight: 2,
      packagePhotoUrl: '/uploads/box.png',
      status: 'ACTIVE',
    });
  });

  it('lists available requests with filters', () => {
    service.getAvailableRequests({ departure: 'Paris', destination: 'Abidjan', date: '2026-07-01' }).subscribe();

    const req = httpMock.expectOne((request) =>
      request.url === '/api/parcel-requests'
      && request.params.get('departure') === 'Paris'
      && request.params.get('destination') === 'Abidjan'
      && request.params.get('date') === '2026-07-01'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('uploads a package photo', () => {
    const file = new File(['x'], 'box.png', { type: 'image/png' });
    service.uploadPhoto(5, file).subscribe();

    const req = httpMock.expectOne('/api/parcel-requests/5/photo');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    req.flush({
      id: 5,
      senderId: 10,
      senderName: 'Alice Sender',
      departure: 'Paris',
      destination: 'Abidjan',
      packageTitle: 'Documents',
      weight: 2,
      status: 'ACTIVE',
    });
  });
});
