import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthResponse, UserResponse } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';
import { GoogleAuthButtonComponent } from '../../components/google-auth-button/google-auth-button.component';

/**
 * LoginPageComponent - User authentication page with email/password form.
 */
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, GoogleAuthButtonComponent],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  isLoading = false;
  isGoogleLoading = false;
  errorMessage = '';

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;
    this.authService.login(email!, password!).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.navigateAfterAuth(response);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.loginForm.patchValue({ password: '' });
        this.errorMessage = err?.error?.message || 'Email ou mot de passe incorrect.';
      },
    });
  }

  onGoogleCredential(idToken: string): void {
    if (this.isGoogleLoading) return;

    this.isGoogleLoading = true;
    this.errorMessage = '';

    this.authService.googleLogin(idToken).subscribe({
      next: (response) => {
        this.isGoogleLoading = false;
        this.navigateAfterAuth(response);
      },
      error: (err: any) => {
        this.isGoogleLoading = false;
        this.errorMessage = err?.error?.message || 'Connexion Google impossible pour le moment.';
      },
    });
  }

  private navigateAfterAuth(response: AuthResponse): void {
    if (this.requiresIdentityDocument(response.user)) {
      this.router.navigate(['/dashboard'], { queryParams: { tab: 'profile', completeProfile: 'identity' } });
      return;
    }

    this.router.navigate(['/search']);
  }

  private requiresIdentityDocument(user: UserResponse): boolean {
    return !user.identityDocument?.trim();
  }
}
