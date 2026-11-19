import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

export interface Turnstile {
  ready(callback: () => void): void;
  render(container: HTMLElement, options: {
    sitekey: string;
    language: string;
    size: 'flexible' | 'compact';
    'response-field': boolean;
    callback: (token: string) => void;
    'expired-callback': () => void;
    'error-callback': () => void;
  }): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

@Injectable({ providedIn: 'root' })
export class TurnstileLoaderService {
  private readonly document = inject(DOCUMENT);
  private loading?: Promise<Turnstile>;

  load(): Promise<Turnstile> {
    return this.loading ??= new Promise<Turnstile>((resolve, reject) => {
      const script = this.document.createElement('script');
      const fail = () => {
        script.remove();
        reject(new Error('Turnstile could not be loaded'));
      };
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onerror = fail;
      script.onload = () => {
        const browser = this.document.defaultView as (Window & { turnstile?: Turnstile }) | null;
        const api = browser?.turnstile;
        if (api) {
          api.ready(() => resolve(api));
        } else {
          fail();
        }
      };
      this.document.head.append(script);
    }).catch((error: unknown) => {
      this.loading = undefined;
      throw error;
    });
  }
}
