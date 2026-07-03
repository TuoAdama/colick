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
