import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export type GoogleButtonText = 'signin_with' | 'signup_with';

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private readonly authService = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private scriptLoadingPromise?: Promise<void>;

  async renderButton(
    hostElement: HTMLElement,
    buttonText: GoogleButtonText,
    onCredential: (credential: string) => void
  ): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    const config = await firstValueFrom(this.authService.getGoogleAuthConfig());
    if (!config.enabled || !config.clientId) {
      hostElement.innerHTML = '';
      return false;
    }

    await this.ensureScriptLoaded();

    const googleAccounts = window.google?.accounts.id;
    if (!googleAccounts) {
      throw new Error('Google Identity Services indisponible.');
    }

    hostElement.innerHTML = '';
    googleAccounts.initialize({
      client_id: config.clientId,
      callback: ({ credential }) => {
        if (credential) {
          onCredential(credential);
        }
      },
    });
    googleAccounts.renderButton(hostElement, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      width: 360,
      text: buttonText,
      logo_alignment: 'left',
    });
    return true;
  }

  private ensureScriptLoaded(): Promise<void> {
    if (window.google?.accounts.id) {
      return Promise.resolve();
    }

    if (this.scriptLoadingPromise) {
      return this.scriptLoadingPromise;
    }

    const existingScript = this.document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');
    if (existingScript) {
      this.scriptLoadingPromise = this.waitForGoogle();
      return this.scriptLoadingPromise;
    }

    this.scriptLoadingPromise = new Promise<void>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-google-identity', 'true');
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Impossible de charger Google Identity Services.'));
      this.document.head.appendChild(script);
    })
      .then(() => this.waitForGoogle())
      .catch((error: unknown) => {
        this.scriptLoadingPromise = undefined;
        throw error;
      });

    return this.scriptLoadingPromise;
  }

  private waitForGoogle(): Promise<void> {
    if (window.google?.accounts.id) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 20;
      const timer = window.setInterval(() => {
        attempts += 1;

        if (window.google?.accounts.id) {
          window.clearInterval(timer);
          resolve();
          return;
        }

        if (attempts >= maxAttempts) {
          window.clearInterval(timer);
          reject(new Error('Google Identity Services indisponible.'));
        }
      }, 100);
    });
  }
}
