import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GoogleAuthButtonComponent } from '../../components/google-auth-button/google-auth-button.component';
import { navigateAfterAuth, readAuthReturnUrl } from '../../shared/auth-return-url';

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
  private readonly route = inject(ActivatedRoute);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  isLoading = false;
  isGoogleLoading = false;
  errorMessage = '';
  successMessage = this.router.getCurrentNavigation()?.extras.state?.['successMessage'] ?? '';

  get returnUrl(): string | undefined {
    return readAuthReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;
    this.authService.login(email!, password!).subscribe({
      next: () => {
        this.isLoading = false;
        void navigateAfterAuth(this.router, this.returnUrl);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.loginForm.patchValue({ password: '' });
        this.errorMessage = err?.status === 429
          ? 'Trop de tentatives. Veuillez réessayer plus tard.'
          : 'Adresse e-mail ou mot de passe invalide.';
      },
    });
  }

  onGoogleCredential(idToken: string): void {
    if (this.isGoogleLoading) return;

    this.isGoogleLoading = true;
    this.errorMessage = '';

    this.authService.googleLogin(idToken).subscribe({
      next: () => {
        this.isGoogleLoading = false;
        void navigateAfterAuth(this.router, this.returnUrl);
      },
      error: (err: any) => {
        this.isGoogleLoading = false;
        this.errorMessage = err?.error?.message || 'Connexion Google impossible pour le moment.';
      },
    });
  }
}
