import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GoogleAuthButtonComponent } from '../../components/google-auth-button/google-auth-button.component';

/**
 * RegisterPageComponent - User registration page.
 */
@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, GoogleAuthButtonComponent],
  templateUrl: './register-page.component.html',
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  registerForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.passwordMatchValidator });

  isLoading = false;
  isGoogleLoading = false;
  errorMessage = '';
  successMessage = '';

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const pw = control.get('password')?.value;
    const cpw = control.get('confirmPassword')?.value;
    return pw === cpw ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';

    const v = this.registerForm.value;
    this.authService.register({
      firstName: v.firstName!, lastName: v.lastName!, email: v.email!,
      phone: v.phone || undefined, password: v.password!,
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = "Compte créé. Vérifiez votre e-mail pour activer votre compte avant de vous connecter.";
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de la création du compte.';
      },
    });
  }

  onGoogleCredential(idToken: string): void {
    if (this.isGoogleLoading) return;

    this.isGoogleLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.googleLogin(idToken).subscribe({
      next: () => {
        this.isGoogleLoading = false;
        this.router.navigate(['/search']);
      },
      error: (err: any) => {
        this.isGoogleLoading = false;
        this.errorMessage = err?.error?.message || 'Inscription Google impossible pour le moment.';
      },
    });
  }

}
