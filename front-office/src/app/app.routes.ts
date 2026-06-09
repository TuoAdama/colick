import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

/**
 * Application route definitions.
 * Landing page loads eagerly; feature pages are lazy-loaded.
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
    path: 'traveler-review',
    loadComponent: () =>
      import('./pages/review/review-page.component').then(
        (m) => m.ReviewPageComponent
      ),
  },
  {
    path: 'propose/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/propose-trip/propose-trip-page.component').then(
        (m) => m.ProposeTripPageComponent
      ),
  },
  {
    path: 'propose',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/propose-trip/propose-trip-page.component').then(
        (m) => m.ProposeTripPageComponent
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
    path: 'messages',
    loadComponent: () =>
      import('./pages/messages/messages-page.component').then(
        (m) => m.MessagesPageComponent
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
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard-page.component').then(
        (m) => m.DashboardPageComponent
      ),
  },
  {
    path: 'trips/:tripId/reservations/:bookingId/profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/reservation-sender-profile/reservation-sender-profile-page.component').then(
        (m) => m.ReservationSenderProfilePageComponent
      ),
  },
  {
    path: 'trips/:tripId/reservations/complete',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/trip-completion/trip-completion-page.component').then(
        (m) => m.TripCompletionPageComponent
      ),
  },
  {
    path: 'trips/:tripId/reservations/:bookingId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/reservation-booking-detail/reservation-booking-detail-page.component').then(
        (m) => m.ReservationBookingDetailPageComponent
      ),
  },
  {
    path: 'trips/:tripId/reservations',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/reservation-details/reservation-details-page.component').then(
        (m) => m.ReservationDetailsPageComponent
      ),
  },
  {
    path: 'trips',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/trips-management/trips-management-page.component').then(
        (m) => m.TripsManagementPageComponent
      ),
  },
];
