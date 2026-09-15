import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { PublicTravelerReview, TravelerProfile } from '../../models/traveler-profile.model';
import { TravelerProfileService } from '../../services/traveler-profile.service';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { SeoService } from '../../services/seo.service';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-traveler-profile-page',
  standalone: true,
  imports: [CommonModule, RouterLink, UserAvatarComponent],
  templateUrl: './traveler-profile-page.component.html',
})
export class TravelerProfilePageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(TravelerProfileService);
  private readonly seo = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);
  private subscription?: Subscription;

  profile: TravelerProfile | null = null;
  reviews: PublicTravelerReview[] = [];
  isLoading = true;
  reviewsLoading = false;
  errorMessage = '';
  currentPage = 0;
  totalPages = 0;

  ngOnInit(): void {
    this.subscription = this.route.paramMap.subscribe(params => {
      const id = Number(params.get('travelerId'));
      if (!Number.isInteger(id) || id <= 0) {
        void this.router.navigate(['/404']);
        return;
      }
      this.load(id);
    });
  }

  ngOnDestroy(): void { this.subscription?.unsubscribe(); }

  loadMore(): void {
    if (!this.profile || this.reviewsLoading || this.currentPage + 1 >= this.totalPages) return;
    this.loadReviews(this.profile.travelerId, this.currentPage + 1, true);
  }

  memberSinceLabel(): string {
    if (!this.profile?.memberSince) return 'Ancienneté non disponible';
    const date = new Date(this.profile.memberSince).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return this.profile.memberSinceEstimated ? `Activité connue depuis ${date}` : `Membre depuis ${date}`;
  }

  responseDelayLabel(): string {
    const minutes = this.profile?.averageResponseTimeMinutes;
    if (minutes == null) return '—';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.round(minutes / 60);
    return hours < 24 ? `${hours} h` : `${Math.round(hours / 24)} j`;
  }

  formatReviewDate(value: string): string {
    return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  private load(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.reviews = [];
    this.service.getProfile(id).subscribe({
      next: profile => {
        this.profile = profile;
        this.isLoading = false;
        const rating = profile.averageRating == null ? 'Aucun avis' : `${profile.averageRating.toFixed(1)}/5 sur ${profile.reviewCount} avis`;
        this.seo.updateMetadata({
          title: `${profile.displayName} | Profil voyageur Coliclic`,
          description: `${profile.displayName}, voyageur Coliclic. ${profile.completedTripCount} trajets terminés, ${rating}.`,
          type: 'profile',
          structuredData: {
            '@context': 'https://schema.org', '@type': 'ProfilePage', name: profile.displayName,
            url: this.router.url.split(/[?#]/)[0],
            mainEntity: { '@type': 'Person', name: profile.displayName, image: profile.photoUrl ?? undefined },
          },
        });
        this.analytics.track('detail_opened', { detail_type: 'traveler', traveler_id: profile.travelerId });
        this.loadReviews(id, 0, false);
      },
      error: error => {
        this.isLoading = false;
        if (error?.status === 404) void this.router.navigate(['/404']);
        else this.errorMessage = 'Impossible de charger ce profil pour le moment.';
      },
    });
  }

  private loadReviews(id: number, page: number, append: boolean): void {
    this.reviewsLoading = true;
    this.service.getReviews(id, page).subscribe({
      next: result => {
        this.reviews = append ? [...this.reviews, ...result.content] : result.content;
        this.currentPage = result.page;
        this.totalPages = result.totalPages;
        this.reviewsLoading = false;
      },
      error: () => this.reviewsLoading = false,
    });
  }
}
