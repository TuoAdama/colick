import {
  Injectable,
  PLATFORM_ID,
  TransferState,
  inject,
  makeStateKey,
} from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, catchError, finalize, firstValueFrom, of, tap } from 'rxjs';
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
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);
  private readonly sessionStateKey = makeStateKey<UserResponse | null>('coliclic.auth.user');

  private currentUserSubject = new BehaviorSubject<UserResponse | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  async initializeSession(): Promise<void> {
    if (isPlatformBrowser(this.platformId) && this.transferState.hasKey(this.sessionStateKey)) {
      const transferredUser = this.transferState.get(this.sessionStateKey, null);
      this.transferState.remove(this.sessionStateKey);
      this.currentUserSubject.next(transferredUser ? this.normalizeUser(transferredUser) : null);
      await this.initializeCsrf();
      return;
    }

    const user = await firstValueFrom(
      this.http.get<UserResponse>('/api/auth/session').pipe(
        catchError(() => of(null)),
      ),
    );
    const normalizedUser = user ? this.normalizeUser(user) : null;
    this.currentUserSubject.next(normalizedUser);
    if (isPlatformServer(this.platformId)) {
      this.transferState.set(this.sessionStateKey, normalizedUser);
    } else {
      await this.initializeCsrf();
    }
  }

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

  isLoggedIn(): boolean {
    return this.getUser() !== null;
  }

  logout(): void {
    this.http.post<void>('/api/auth/logout', {}).pipe(
      finalize(() => this.clearSessionAndRedirect()),
    ).subscribe({ error: () => undefined });
  }

  clearSessionAndRedirect(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.google?.accounts.id.disableAutoSelect();
    }
    this.currentUserSubject.next(null);
    void this.router.navigate(['/login']);
  }

  getUser(): UserResponse | null {
    return this.currentUserSubject.getValue();
  }

  /** Update basic profile info (firstName, lastName, phone). */
  updateProfile(id: number, data: UpdateProfileRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`/api/users/${id}`, data).pipe(
      tap((user) => {
        this.setUser(user);
      })
    );
  }

  /** Upload a profile photo (multipart). */
  uploadPhoto(id: number, file: File): Observable<UserResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<UserResponse>(`/api/users/${id}/photo`, form).pipe(
      tap((user) => {
        this.setUser(user);
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
          this.setUser(user);
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
        this.setUser(res.user);
      })
    );
  }

  private async initializeCsrf(): Promise<void> {
    await firstValueFrom(
      this.http.get('/api/auth/csrf').pipe(catchError(() => of(null))),
    );
  }

  private setUser(user: UserResponse): void {
    const normalizedUser = this.normalizeUser(user);
    this.currentUserSubject.next(normalizedUser);
  }

  private normalizeUser(user: UserResponse & { identityDocument?: unknown }): UserResponse {
    const { identityDocument: _removedIdentityDocument, ...identityFreeUser } = user;
    return {
      ...identityFreeUser,
      hasPassword: user.hasPassword !== false,
      photoUrl: this.photoUrlService.normalizePhotoUrl(user.photoUrl),
    };
  }
}
