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

    expect(button.textContent?.trim()).toBe('Profil voyageur');
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

  it('navigates between profile sections and moves keyboard focus to the target', () => {
    const reviews = fixture.nativeElement.querySelector('#traveler-reviews') as HTMLElement;
    const activity = fixture.nativeElement.querySelector('#traveler-activity') as HTMLElement;
    const reviewsScroll = spyOn(reviews, 'scrollIntoView');
    const activityScroll = spyOn(activity, 'scrollIntoView');
    const buttons = fixture.nativeElement.querySelectorAll('nav[aria-label="Sections du profil"] button');

    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].textContent).toContain('Avis (1)');
    buttons[1].click();
    fixture.detectChanges();

    expect(reviewsScroll).toHaveBeenCalledWith({ block: 'start' });
    expect(document.activeElement).toBe(reviews);
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');

    buttons[0].click();
    fixture.detectChanges();
    expect(activityScroll).toHaveBeenCalledWith({ block: 'start' });
    expect(document.activeElement).toBe(activity);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('renders the new traveler empty state without an invented rating or response rate', () => {
    const component = fixture.componentInstance;
    component.profile = {
      ...component.profile!, completedTripCount: 0, reviewCount: 0,
      averageRating: null, responseSampleSize: 0,
      memberSince: '2026-08-01T10:00:00', memberSinceEstimated: true,
    };
    component.reviews = [];
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Avis (0)');
    expect(text).toContain('Activité connue depuis août 2026');
    expect(text).toContain('Pas assez de données');
    expect(text).toContain('Aucun avis publié pour le moment.');
    expect(text).not.toContain('Taux de réponse');
    expect(fixture.nativeElement.querySelector('[aria-label="Note moyenne"]')).toBeNull();
  });

  it('preserves ratings and loads the next review page from the redesigned card', () => {
    profileService.getReviews.calls.reset();
    fixture.componentInstance.totalPages = 2;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-label="Note moyenne"]').textContent).toMatch(/4[.,]5\/5/);
    const loadMore = [...fixture.nativeElement.querySelectorAll('button')]
      .find((button: HTMLButtonElement) => button.textContent?.includes('Afficher plus'));
    loadMore.click();
    expect(profileService.getReviews).toHaveBeenCalledOnceWith(7, 1);
    expect(fixture.componentInstance.reviews.length).toBe(2);
  });

  it('hides the verification badge when email is not verified and keeps support available', () => {
    fixture.componentInstance.profile = { ...fixture.componentInstance.profile!, emailVerified: false };
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('E-mail vérifié');
    const support = fixture.nativeElement.querySelector('nav[aria-label="Assistance pour ce profil"] a');
    expect(support.getAttribute('href')).toBe('/contact');
  });

  it('keeps loading and error states outside the profile cards', () => {
    fixture.componentInstance.isLoading = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Chargement du profil');
    expect(fixture.nativeElement.querySelector('#traveler-activity')).toBeNull();
    fixture.componentInstance.isLoading = false;
    fixture.componentInstance.errorMessage = 'Impossible de charger ce profil pour le moment.';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Impossible de charger');
    expect(fixture.nativeElement.querySelector('#traveler-reviews')).toBeNull();
  });

});
