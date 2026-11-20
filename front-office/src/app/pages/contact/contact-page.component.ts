import { Component, DestroyRef, ElementRef, OnInit, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ContactService } from '../../services/contact.service';
import { ActivatedRoute } from '@angular/router';
import { AppConfigService } from '../../services/app-config.service';
import { Turnstile, TurnstileLoaderService } from '../../services/turnstile-loader.service';

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
  private readonly turnstileLoader = inject(TurnstileLoaderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly turnstileContainer = viewChild<ElementRef<HTMLElement>>('turnstileContainer');
  private destroyed = false;
  private widget?: { api: Turnstile; id: string };
  private reportTravelerId?: number;
  private reportTripId?: number;
  isProfileReport = false;

  readonly isDispute = this.route?.snapshot.data['contactMode'] === 'dispute';
  readonly turnstileSiteKey = inject(AppConfigService).config().contactTurnstileSiteKey;
  readonly turnstileToken = signal('');
  readonly turnstileError = signal(this.turnstileSiteKey ? '' : 'La vérification anti-spam est temporairement indisponible.');
  readonly referenceMaxLength = 100;
  readonly messageMaxLength = this.isDispute ? 4700 : 5000;
  readonly contactForm = this.fb.nonNullable.group({
    email: ['', [requiredTrimmed, Validators.email, Validators.maxLength(254)]],
    subject: ['', this.isDispute ? [] : [requiredTrimmed, Validators.maxLength(150)]],
    message: ['', [requiredTrimmed, Validators.maxLength(this.messageMaxLength)]],
    tripReference: ['', Validators.maxLength(this.referenceMaxLength)],
    bookingReference: ['', Validators.maxLength(this.referenceMaxLength)],
  });

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor() {
    if (!this.isDispute && this.turnstileSiteKey) {
      afterNextRender(() => void this.startTurnstile());
    }
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.widget?.api.remove(this.widget.id);
    });
  }

  async startTurnstile(): Promise<void> {
    this.turnstileError.set('');
    if (this.widget) {
      this.resetTurnstile();
      return;
    }

    const container = this.turnstileContainer()?.nativeElement;
    const sitekey = this.turnstileSiteKey;
    if (!container || !sitekey) return;

    try {
      const api = await this.turnstileLoader.load();
      if (this.destroyed) return;
      const id = api.render(container, {
        sitekey,
        language: 'fr',
        size: container.clientWidth < 300 ? 'compact' : 'flexible',
        'response-field': false,
        callback: (token) => {
          this.turnstileToken.set(token);
          this.turnstileError.set('');
        },
        'expired-callback': () => this.turnstileToken.set(''),
        'error-callback': () => this.onTurnstileError(),
      });
      this.widget = { api, id };
    } catch {
      if (!this.destroyed) this.onTurnstileError();
    }
  }

  private onTurnstileError(): void {
    this.turnstileToken.set('');
    this.turnstileError.set('La vérification anti-spam a échoué. Veuillez réessayer.');
  }

  private resetTurnstile(): void {
    this.turnstileToken.set('');
    this.widget?.api.reset(this.widget.id);
  }

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
    const turnstileToken = this.turnstileToken();
    if (this.contactForm.invalid || this.isLoading || (!this.isDispute && !turnstileToken)) {
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
    const submission = this.isDispute
      ? this.contactService.submitDispute({
          email,
          description: message.trim(),
          tripReference: tripReference.trim() || undefined,
          bookingReference: bookingReference.trim() || undefined,
        })
      : this.contactService.send({ ...payload, turnstileToken });
    submission.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isLoading = false;
        this.contactForm.reset({ subject: this.isProfileReport ? 'Signalement d’un profil voyageur' : '' });
        if (!this.isDispute) this.resetTurnstile();
        this.successMessage = this.isDispute
          ? 'Votre réclamation a bien été envoyée. Notre équipe vous répondra par e-mail.'
          : 'Votre message a bien été envoyé. Notre équipe vous répondra dès que possible.';
      },
      error: (error: { status?: number }) => {
        this.isLoading = false;
        if (!this.isDispute) this.resetTurnstile();
        this.errorMessage = error?.status === 429
          ? 'Trop de messages ont été envoyés. Veuillez réessayer dans quelques minutes.'
          : error?.status === 422
            ? 'La vérification anti-spam a expiré ou a été refusée. Veuillez réessayer.'
            : 'Une erreur technique est survenue. Veuillez réessayer dans quelques instants.';
      },
    });
  }
}
