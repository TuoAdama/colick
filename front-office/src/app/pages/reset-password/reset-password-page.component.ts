import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password-page.component.html',
})
export class ResetPasswordPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  resetPasswordForm = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator }
  );

  isLoading = false;
  isSuccess = false;
  errorMessage = '';
  private token = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.errorMessage = 'Le lien de reinitialisation est invalide ou incomplet.';
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (!this.token || this.resetPasswordForm.invalid || this.isLoading) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const password = this.resetPasswordForm.value.password!;
    const confirmPassword = this.resetPasswordForm.value.confirmPassword!;

    this.authService.resetPassword(this.token, password, confirmPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.isSuccess = true;
        this.resetPasswordForm.reset();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage =
          err?.error?.message ||
          'Impossible de reinitialiser le mot de passe. Le lien est peut-etre expire.';
      },
    });
  }
}
