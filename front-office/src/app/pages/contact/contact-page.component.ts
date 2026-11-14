import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ContactService } from '../../services/contact.service';
import { ActivatedRoute } from '@angular/router';

function requiredTrimmed(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() ? null : { required: true };
}

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-page.component.html',
})
export class ContactPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly contactService = inject(ContactService);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private reportTravelerId?: number;
  private reportTripId?: number;
  isProfileReport = false;

  readonly contactForm = this.fb.nonNullable.group({
    email: ['', [requiredTrimmed, Validators.email, Validators.maxLength(254)]],
    subject: ['', [requiredTrimmed, Validators.maxLength(150)]],
    message: ['', [requiredTrimmed, Validators.maxLength(5000)]],
  });

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    const params = this.route?.snapshot.queryParamMap;
    if (!params) return;
    const travelerId = Number(params.get('travelerId'));
    const tripId = Number(params.get('tripId'));
    if (params.get('type') === 'report' && Number.isInteger(travelerId) && travelerId > 0) {
      this.isProfileReport = true;
      this.reportTravelerId = travelerId;
      this.reportTripId = Number.isInteger(tripId) && tripId > 0 ? tripId : undefined;
      this.contactForm.controls.subject.setValue('Signalement d’un profil voyageur');
    }
  }

  onSubmit(): void {
    if (this.contactForm.invalid || this.isLoading) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';
    const payload = this.isProfileReport
      ? {
          ...this.contactForm.getRawValue(),
          category: 'PROFILE_REPORT' as const,
          travelerId: this.reportTravelerId,
          ...(this.reportTripId && { tripId: this.reportTripId }),
        }
      : this.contactForm.getRawValue();
    this.contactService.send(payload).subscribe({
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
