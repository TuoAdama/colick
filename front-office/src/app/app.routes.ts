import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

/**
 * Application route definitions.
 * Landing page loads eagerly; feature pages are lazy-loaded.
 * Authenticated pages share a layout shell via a pathless parent route.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing-page.component').then(
        (m) => m.LandingPageComponent
      ),
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./pages/search/search-page.component').then(
        (m) => m.SearchPageComponent
      ),
  },
  {
    path: 'parcel-search',
    loadComponent: () =>
      import('./pages/parcel-search/parcel-search-page.component').then(
        (m) => m.ParcelSearchPageComponent
      ),
  },
  {
    path: 'comment-ca-marche',
    loadComponent: () =>
      import('./pages/how-it-works/how-it-works-page.component').then(
        (m) => m.HowItWorksPageComponent
      ),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact/contact-page.component').then(
        (m) => m.ContactPageComponent
      ),
  },
  {
    path: 'tarifs',
    data: {
      seo: {
        title: 'Tarifs | Coliclic',
        description: 'Découvrez le calcul des tarifs et le mode commercial actif sur Coliclic.',
        index: true,
      },
    },
    loadComponent: () =>
      import('./pages/pricing/pricing-page.component').then((m) => m.PricingPageComponent),
  },
  ...[
    {
      path: 'a-propos',
      trustSlug: 'about',
      title: 'À propos de Coliclic',
      description: 'Mission, fonctionnement et rôle de Coliclic.',
    },
    {
      path: 'aide',
      trustSlug: 'help',
      title: 'Centre d’aide Coliclic',
      description: 'Aide sur les comptes, trajets, réservations et colis Coliclic.',
    },
    {
      path: 'cgu',
      trustSlug: 'terms',
      title: 'Conditions générales d’utilisation | Coliclic',
      description: 'Conditions applicables à l’utilisation de Coliclic.',
    },
    {
      path: 'confidentialite',
      trustSlug: 'privacy',
      title: 'Politique de confidentialité | Coliclic',
      description: 'Traitements de données personnelles et droits des utilisateurs Coliclic.',
    },
    {
      path: 'mentions-legales',
      trustSlug: 'legal-notice',
      title: 'Mentions légales | Coliclic',
      description: 'Informations relatives à l’éditeur et à l’hébergement de Coliclic.',
    },
    {
      path: 'securite',
      trustSlug: 'security',
      title: 'Sécurité et objets interdits | Coliclic',
      description: 'Règles de sécurité, emballage, douane et objets interdits sur Coliclic.',
    },
    {
      path: 'annulation-litiges',
      trustSlug: 'cancellation-disputes',
      title: 'Annulation et litiges | Coliclic',
      description: 'Règles d’annulation, remboursement et réclamation sur Coliclic.',
    },
  ].map(({ path, trustSlug, title, description }) => ({
    path,
    data: { trustSlug, seo: { title, description, index: true } },
    loadComponent: () =>
      import('./pages/trust/trust-page.component').then((m) => m.TrustPageComponent),
  } satisfies Routes[number])),
  {
    path: 'trips/ref/:reference',
    loadComponent: () =>
      import('./pages/trip-reference/trip-reference-page.component').then(
        (m) => m.TripReferencePageComponent
      ),
  },
  {
    path: 'traveler-review',
    loadComponent: () =>
      import('./pages/review/review-page.component').then(
        (m) => m.ReviewPageComponent
      ),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login/login-page.component').then(
        (m) => m.LoginPageComponent
      ),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/register/register-page.component').then(
        (m) => m.RegisterPageComponent
      ),
  },
  {
    path: 'confirm-email',
    loadComponent: () =>
      import('./pages/confirm-email/confirm-email-page.component').then(
        (m) => m.ConfirmEmailPageComponent
      ),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password-page.component').then(
        (m) => m.ForgotPasswordPageComponent
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password-page.component').then(
        (m) => m.ResetPasswordPageComponent
      ),
  },
  {
    path: '404',
    loadComponent: () =>
      import('./pages/not-found/not-found-page.component').then(
        (m) => m.NotFoundPageComponent
      ),
  },
  // ── Authenticated pages with dashboard shell layout ──────────────────────
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/dashboard-layout/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard-page.component').then(
            (m) => m.DashboardPageComponent
          ),
      },
      {
        path: 'trips/:tripId/reservations/:bookingId/profile',
        loadComponent: () =>
          import('./pages/reservation-sender-profile/reservation-sender-profile-page.component').then(
            (m) => m.ReservationSenderProfilePageComponent
          ),
      },
      {
        path: 'trips/:tripId/reservations/complete',
        loadComponent: () =>
          import('./pages/trip-completion/trip-completion-page.component').then(
            (m) => m.TripCompletionPageComponent
          ),
      },
      {
        path: 'trips/:tripId/reservations/:bookingId',
        loadComponent: () =>
          import('./pages/reservation-booking-detail/reservation-booking-detail-page.component').then(
            (m) => m.ReservationBookingDetailPageComponent
          ),
      },
      {
        path: 'trips/:tripId/reservations',
        loadComponent: () =>
          import('./pages/reservation-details/reservation-details-page.component').then(
            (m) => m.ReservationDetailsPageComponent
          ),
      },
      {
        path: 'trips',
        loadComponent: () =>
          import('./pages/trips-management/trips-management-page.component').then(
            (m) => m.TripsManagementPageComponent
          ),
      },
      {
        path: 'propose/:id',
        loadComponent: () =>
          import('./pages/propose-trip/propose-trip-page.component').then(
            (m) => m.ProposeTripPageComponent
          ),
      },
      {
        path: 'propose',
        loadComponent: () =>
          import('./pages/propose-trip/propose-trip-page.component').then(
            (m) => m.ProposeTripPageComponent
          ),
      },
      {
        path: 'parcel-requests/new',
        loadComponent: () =>
          import('./pages/parcel-request-form/parcel-request-form-page.component').then(
            (m) => m.ParcelRequestFormPageComponent
          ),
      },
      {
        path: 'parcel-requests',
        loadComponent: () =>
          import('./pages/parcel-requests/parcel-requests-page.component').then(
            (m) => m.ParcelRequestsPageComponent
          ),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./pages/messages/messages-page.component').then(
            (m) => m.MessagesPageComponent
          ),
      },
      {
        path: 'alerts',
        loadComponent: () =>
          import('./pages/alerts/alerts-page.component').then(
            (m) => m.AlertsPageComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings-page.component').then(
            (m) => m.SettingsPageComponent
          ),
      },
      {
        path: 'sent-bookings/:tripId/:bookingId',
        loadComponent: () =>
          import('./pages/sent-booking-detail/sent-booking-detail-page.component').then(
            (m) => m.SentBookingDetailPageComponent
          ),
      },
      {
        path: 'sent-bookings',
        loadComponent: () =>
          import('./pages/sent-bookings/sent-bookings-page.component').then(
            (m) => m.SentBookingsPageComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
