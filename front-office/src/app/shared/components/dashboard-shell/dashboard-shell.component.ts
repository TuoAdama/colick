import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard-shell.component.html',
})
export class DashboardShellComponent {
  private readonly authService = inject(AuthService);

  isMobileMenuOpen = false;
  private profilePhotoLoadFailed = false;
  private lastProfilePhotoUrl: string | null = null;

  currentUserName(): string {
    const user = this.authService.getUser();
    const name = [user?.firstName?.trim(), user?.lastName?.trim()]
      .filter((value): value is string => !!value)
      .join(' ')
      .trim();

    return name || 'Mon espace';
  }

  currentUserEmail(): string {
    return this.authService.getUser()?.email ?? '';
  }

  hasUserPhoto(): boolean {
    return !!this.userPhotoUrl();
  }

  userPhotoUrl(): string | null {
    const photoUrl = this.authService.getUser()?.photoUrl?.trim() ?? null;
    if (!photoUrl) {
      this.profilePhotoLoadFailed = false;
      this.lastProfilePhotoUrl = null;
      return null;
    }

    if (photoUrl !== this.lastProfilePhotoUrl) {
      this.profilePhotoLoadFailed = false;
      this.lastProfilePhotoUrl = photoUrl;
    }

    return this.profilePhotoLoadFailed ? null : photoUrl;
  }

  userInitials(): string {
    const user = this.authService.getUser();
    const firstInitial = user?.firstName?.trim().charAt(0) ?? '';
    const lastInitial = user?.lastName?.trim().charAt(0) ?? '';
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();

    if (initials) {
      return initials;
    }

    return user?.email?.trim().charAt(0).toUpperCase() ?? 'U';
  }

  onUserPhotoError(): void {
    this.profilePhotoLoadFailed = true;
  }

  logout(): void {
    this.authService.logout();
  }

  openMobileMenu(): void {
    this.isMobileMenuOpen = true;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}
