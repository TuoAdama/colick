import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { convertToParamMap, ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { TravelerProfileService } from '../../services/traveler-profile.service';
import { TravelerProfilePageComponent } from './traveler-profile-page.component';

describe('TravelerProfilePageComponent', () => {
  let fixture: ComponentFixture<TravelerProfilePageComponent>;
  let originalHistoryState: unknown;
  let back: jasmine.Spy;
  let navigate: jasmine.Spy;
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
    originalHistoryState = window.history.state;
    await TestBed.configureTestingModule({
      imports: [TravelerProfilePageComponent],
      providers: [
        provideRouter([]),
        { provide: TravelerProfileService, useValue: profileService },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ travelerId: '7' })) } },
      ],
    }).compileComponents();
    back = spyOn(TestBed.inject(Location), 'back');
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(TravelerProfilePageComponent);
    fixture.detectChanges();
  });

  afterEach(() => window.history.replaceState(originalHistoryState, ''));

  it('returns to the previous page when the Retour button is clicked', () => {
    window.history.replaceState({ navigationId: 2 }, '');
    const button = fixture.nativeElement.querySelector('button[aria-label="Retour à la page précédente"]') as HTMLButtonElement;

    expect(button.textContent?.replace('←', '').trim()).toBe('Retour');
    expect(fixture.nativeElement.textContent).not.toContain('Retour aux trajets');
    button.click();

    expect(back).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('falls back to search when the profile is the first in-app page', () => {
    window.history.replaceState({ navigationId: 1 }, '');
    fixture.nativeElement.querySelector('button[aria-label="Retour à la page précédente"]').click();

    expect(back).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledOnceWith(['/search']);
  });

  it('falls back to search when no Angular navigation history is available', () => {
    window.history.replaceState(null, '');
    fixture.componentInstance.goBack();

    expect(back).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledOnceWith(['/search']);
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
