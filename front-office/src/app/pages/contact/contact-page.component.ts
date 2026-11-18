import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ContactService } from '../../services/contact.service';
import { ActivatedRoute } from '@angular/router';

const DISPUTE_SUBJECT = '[Litige] Réclamation';

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

  readonly isDispute = this.route?.snapshot.data['contactMode'] === 'dispute';
  readonly referenceMaxLength = 100;
  // Leave room for both labeled references in the 5,000-character API message.
  readonly messageMaxLength = this.isDispute ? 4700 : 5000;
  readonly contactForm = this.fb.nonNullable.group({
    email: ['', [requiredTrimmed, Validators.email, Validators.maxLength(254)]],
    subject: [this.isDispute ? DISPUTE_SUBJECT : '', [requiredTrimmed, Validators.maxLength(150)]],
    message: ['', [requiredTrimmed, Validators.maxLength(this.messageMaxLength)]],
    tripReference: ['', Validators.maxLength(this.referenceMaxLength)],
    bookingReference: ['', Validators.maxLength(this.referenceMaxLength)],
  });

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    const params = this.route?.snapshot.queryParamMap;
    if (this.isDispute || !params) return;
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
    const { email, subject, message, tripReference, bookingReference } = this.contactForm.getRawValue();
    const payload = this.isProfileReport
      ? {
          email, subject, message,
          category: 'PROFILE_REPORT' as const,
          travelerId: this.reportTravelerId,
          ...(this.reportTripId && { tripId: this.reportTripId }),
        }
      : { email, subject, message };
    if (this.isDispute) {
      const references: string[] = [];
      if (tripReference.trim()) references.push(`Référence du trajet : ${tripReference.trim()}`);
      if (bookingReference.trim()) references.push(`Référence de la réservation : ${bookingReference.trim()}`);
      payload.message = [...references, message.trim()].join('\n\n');
    }
    this.contactService.send(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.contactForm.reset();
        this.successMessage = this.isDispute
          ? 'Votre réclamation a bien été envoyée. Notre équipe vous répondra par e-mail.'
          : 'Votre message a bien été envoyé. Notre équipe vous répondra dès que possible.';
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
