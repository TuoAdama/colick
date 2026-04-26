import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessagingService } from '../../services/messaging.service';
@Component({ selector: 'app-header', standalone: true, imports: [CommonModule, RouterLink, AsyncPipe], templateUrl: './header.component.html' })
export class HeaderComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly messagingService = inject(MessagingService);
  isMobileMenuOpen = false;
  isProfileMenuOpen = false;
  private profilePhotoLoadFailed = false;
  private lastProfilePhotoUrl: string | null = null;
  ngOnInit(): void { if (this.authService.isLoggedIn()) { this.messagingService.refreshUnreadCount(); } }
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) this.isProfileMenuOpen = false;
  }
  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }
  closeMenus(): void {
    this.isMobileMenuOpen = false;
    this.isProfileMenuOpen = false;
  }
  logout(): void {
    this.authService.logout();
    this.messagingService.resetUnreadCount();
    this.closeMenus();
  }
  @HostListener('document:click')
  onDocumentClick(): void {
    this.isProfileMenuOpen = false;
  }

  hasProfilePhoto(): boolean {
    return !!this.getProfilePhotoUrl();
  }

  getProfilePhotoUrl(): string | null {
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

  onProfileImageError(): void {
    this.profilePhotoLoadFailed = true;
  }

  getUserInitials(): string {
    const user = this.authService.getUser();
    const firstInitial = user?.firstName?.trim().charAt(0) ?? '';
    const lastInitial = user?.lastName?.trim().charAt(0) ?? '';
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();
    if (initials) return initials;
    return user?.email?.trim().charAt(0).toUpperCase() ?? 'U';
  }
}
