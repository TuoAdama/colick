import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  private readonly route = inject(ActivatedRoute);

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
      next: () => {
        this.isLoading = false;
        this.navigateAfterAuth();
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
      next: () => {
        this.isGoogleLoading = false;
        this.navigateAfterAuth();
      },
      error: (err: any) => {
        this.isGoogleLoading = false;
        this.errorMessage = err?.error?.message || 'Connexion Google impossible pour le moment.';
      },
    });
  }

  private navigateAfterAuth(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl?.startsWith('/') && !returnUrl.startsWith('//')) {
      void this.router.navigateByUrl(returnUrl);
      return;
    }

    this.router.navigate(['/search']);
  }
}
