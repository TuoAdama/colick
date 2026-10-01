import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TravelerProfileService } from '../../services/traveler-profile.service';
import { TravelerProfilePageComponent } from './traveler-profile-page.component';

describe('TravelerProfilePageComponent', () => {
  let fixture: ComponentFixture<TravelerProfilePageComponent>;
  const profileService = {
    getProfile: jasmine.createSpy('getProfile').and.returnValue(of({
      travelerId: 7, displayName: 'Alice Martin', emailVerified: true,
      memberSince: '2025-02-01T10:00:00', memberSinceEstimated: false,
      completedTripCount: 4, averageRating: 4.5, reviewCount: 1,
      responseRatePercent: 75, averageResponseTimeMinutes: 60, responseSampleSize: 4,
    })),
    getReviews: jasmine.createSpy('getReviews').and.returnValue(of({
      content: [{ id: 1, reviewerDisplayName: 'Bob D.', rating: 5, comment: 'Très fiable', submittedAt: '2026-08-01T10:00:00' }],
      page: 0, size: 10, totalElements: 1, totalPages: 1,
    })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelerProfilePageComponent],
      providers: [
        provideRouter([]),
        { provide: TravelerProfileService, useValue: profileService },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ travelerId: '7' })) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TravelerProfilePageComponent);
    fixture.detectChanges();
  });

  it('renders verified profile facts and detailed reviews', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('E-mail vérifié');
    expect(text).toContain('4');
    expect(text).toContain('75 %');
    expect(text).toContain('Bob D.');
    expect(text).toContain('Très fiable');
  });

  it('builds a contextual profile report link', () => {
    const report = [...fixture.nativeElement.querySelectorAll('a')]
      .find((link: HTMLAnchorElement) => link.textContent?.includes('Signaler'));
    expect(report?.getAttribute('href')).toContain('travelerId=7');
  });
});
