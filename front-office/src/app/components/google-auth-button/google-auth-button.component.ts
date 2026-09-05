import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { GoogleButtonText, GoogleIdentityService } from '../../services/google-identity.service';

@Component({
  selector: 'app-google-auth-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4" [class.hidden]="!isVisible && !errorMessage">
      <div class="flex items-center gap-4">
        <div class="h-px flex-1 bg-gray-200"></div>
        <span class="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">ou</span>
        <div class="h-px flex-1 bg-gray-200"></div>
      </div>

      @if (errorMessage) {
        <div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error text-center">
          {{ errorMessage }}
        </div>
      }

      <div class="flex justify-center" [class.hidden]="!!errorMessage">
        <div #buttonHost class="w-full flex justify-center"></div>
      </div>
    </div>
  `,
})
export class GoogleAuthButtonComponent implements AfterViewInit {
  private readonly googleIdentityService = inject(GoogleIdentityService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  @ViewChild('buttonHost', { static: true })
  private readonly buttonHost?: ElementRef<HTMLDivElement>;

  @Input() buttonText: GoogleButtonText = 'signin_with';
  @Output() credentialReceived = new EventEmitter<string>();

  isVisible = false;
  errorMessage = '';

  async ngAfterViewInit(): Promise<void> {
    if (!this.buttonHost) return;

    try {
      this.isVisible = await this.googleIdentityService.renderButton(
        this.buttonHost.nativeElement,
        this.buttonText,
        (credential) => this.credentialReceived.emit(credential)
      );
      this.errorMessage = '';
    } catch (error: unknown) {
      this.isVisible = false;
      this.errorMessage = error instanceof Error
        ? error.message
        : 'Google est temporairement indisponible.';
    } finally {
      this.changeDetectorRef.detectChanges();
    }
  }
}
