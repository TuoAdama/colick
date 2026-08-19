import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import {
  AuthResponse,
  ChangeEmailRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  GoogleAuthConfig,
  GoogleAuthRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  UserResponse,
} from '../models/auth.model';
import { PhotoUrlService } from './photo-url.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly photoUrlService = inject(PhotoUrlService);
  private readonly TOKEN_KEY = 'coliclic_token';
  private readonly USER_KEY = 'coliclic_user';

  private currentUserSubject = new BehaviorSubject<UserResponse | null>(this.getStoredUser());
  currentUser$ = this.currentUserSubject.asObservable();

  login(email: string, password: string): Observable<AuthResponse> {
    return this.authenticate('/api/auth/login', { email, password } as LoginRequest);
  }

  googleLogin(idToken: string): Observable<AuthResponse> {
    return this.authenticate('/api/auth/google', { idToken } as GoogleAuthRequest);
  }

  getGoogleAuthConfig(): Observable<GoogleAuthConfig> {
    return this.http.get<GoogleAuthConfig>('/api/auth/google/config');
  }

  register(data: RegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>('/api/users', data);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    window.google?.accounts.id.disableAutoSelect();
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    // Redirect to login page after clearing the session
    this.router.navigate(['/login']);
  }

  getUser(): UserResponse | null {
    return this.currentUserSubject.getValue();
  }

  /** Update basic profile info (firstName, lastName, phone, identityDocument). */
  updateProfile(id: number, data: UpdateProfileRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`/api/users/${id}`, data).pipe(
      tap((user) => {
        this.persistUser(user);
      })
    );
  }

  /** Upload a profile photo (multipart). */
  uploadPhoto(id: number, file: File): Observable<UserResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<UserResponse>(`/api/users/${id}/photo`, form).pipe(
      tap((user) => {
        this.persistUser(user);
      })
    );
  }

  /** Request an e-mail change (sends confirmation link to the new address). */
  requestEmailChange(id: number, newEmail: string): Observable<void> {
    return this.http.post<void>(`/api/users/${id}/change-email`, { newEmail } as ChangeEmailRequest);
  }

  /** Confirm email token (signup activation or email change). */
  confirmEmail(token: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`/api/users/confirm-email`, { params: { token } }).pipe(
      tap((user) => {
        if (this.isLoggedIn()) {
          this.persistUser(user);
        }
      })
    );
  }

  /** Change password (requires old password). */
  changePassword(id: number, oldPassword: string, newPassword: string): Observable<UserResponse> {
    return this.http.put<UserResponse>(`/api/users/${id}/change-password`, {
      oldPassword,
      newPassword,
    } as ChangePasswordRequest);
  }

  /** Request a password reset link. */
  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>('/api/auth/forgot-password', { email } as ForgotPasswordRequest);
  }

  /** Confirm password reset with token and new password. */
  resetPassword(token: string, newPassword: string, confirmPassword: string): Observable<void> {
    return this.http.post<void>('/api/auth/reset-password', {
      token,
      newPassword,
      confirmPassword,
    } as ResetPasswordRequest);
  }

  private authenticate(url: string, body: LoginRequest | GoogleAuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(url, body).pipe(
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        this.persistUser(res.user);
      })
    );
  }

  private getStoredUser(): UserResponse | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as UserResponse;
    return this.normalizeUser(user);
  }

  private persistUser(user: UserResponse): void {
    const normalizedUser = this.normalizeUser(user);
    localStorage.setItem(this.USER_KEY, JSON.stringify(normalizedUser));
    this.currentUserSubject.next(normalizedUser);
  }

  private normalizeUser(user: UserResponse): UserResponse {
    return {
      ...user,
      hasPassword: user.hasPassword !== false,
      photoUrl: this.photoUrlService.normalizePhotoUrl(user.photoUrl),
    };
  }
}
