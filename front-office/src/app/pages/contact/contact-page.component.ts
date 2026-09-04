import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactService } from '../../services/contact.service';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-page.component.html',
})
export class ContactPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly contactService = inject(ContactService);

  readonly contactForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    subject: ['', [Validators.required, Validators.maxLength(150)]],
    message: ['', [Validators.required, Validators.maxLength(5000)]],
  });

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  onSubmit(): void {
    if (this.contactForm.invalid || this.isLoading) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.contactService.send(this.contactForm.getRawValue()).subscribe({
      next: () => {
        this.isLoading = false;
        this.contactForm.reset();
        this.successMessage = 'Votre message a bien été envoyé. Notre équipe vous répondra dès que possible.';
      },
      error: (error: { status?: number }) => {
        this.isLoading = false;
        this.errorMessage = error?.status === 429
          ? 'Trop de messages ont été envoyés. Veuillez réessayer dans quelques minutes.'
          : 'Une erreur technique est survenue. Veuillez réessayer dans quelques instants.';
      },
    });
  }
}
