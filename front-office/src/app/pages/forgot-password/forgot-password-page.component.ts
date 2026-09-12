import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password-page.component.html',
})
export class ForgotPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly genericConfirmationMessage =
    'Si un compte existe avec cet email, un lien de reinitialisation vient d\'etre envoye.';

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  isLoading = false;
  hasSubmitted = false;
  errorMessage = '';

  constructor() {
    const navigationEmail = this.router.getCurrentNavigation()?.extras.state?.['email'];
    if (typeof navigationEmail === 'string') {
      this.forgotPasswordForm.patchValue({ email: navigationEmail });
    }
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid || this.isLoading) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const email = this.forgotPasswordForm.value.email!;
    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.isLoading = false;
        this.hasSubmitted = true;
      },
      error: (err: any) => {
        this.isLoading = false;
        if (err?.status === 429) {
          this.hasSubmitted = false;
          this.errorMessage = 'Trop de demandes. Veuillez réessayer plus tard.';
          return;
        }
        this.hasSubmitted = true;
        this.errorMessage = 'Une erreur technique est survenue. Vous pouvez reessayer dans quelques instants.';
      },
    });
  }
}
