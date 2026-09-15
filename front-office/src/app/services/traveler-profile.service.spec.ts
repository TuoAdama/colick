import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TravelerProfileService } from './traveler-profile.service';

describe('TravelerProfileService', () => {
  let service: TravelerProfileService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(TravelerProfileService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads a public profile without requiring private contact data', () => {
    service.getProfile(7).subscribe(profile => {
      expect(profile.displayName).toBe('Alice Martin');
      expect(profile.photoUrl).toBe('/api/uploads/alice.png');
      expect((profile as unknown as Record<string, unknown>)['email']).toBeUndefined();
      expect((profile as unknown as Record<string, unknown>)['phone']).toBeUndefined();
    });
    http.expectOne('/api/travelers/7/profile').flush({
      travelerId: 7, displayName: 'Alice Martin', photoUrl: '/uploads/alice.png', emailVerified: true,
      memberSinceEstimated: false, completedTripCount: 3, reviewCount: 2, responseSampleSize: 4,
    });
  });

  it('requests reviews ten at a time', () => {
    service.getReviews(7, 1).subscribe();
    const request = http.expectOne(req => req.url === '/api/travelers/7/reviews');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('10');
    request.flush({ content: [], page: 1, size: 10, totalElements: 0, totalPages: 0 });
  });
});
