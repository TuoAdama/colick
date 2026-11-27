import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

export interface Turnstile {
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

type TurnstileWindow = Window & {
  turnstile?: Turnstile;
  onColiclicTurnstileLoad?: () => void;
};

@Injectable({ providedIn: 'root' })
export class TurnstileLoaderService {
  private readonly document = inject(DOCUMENT);
  private loading?: Promise<Turnstile>;

  load(): Promise<Turnstile> {
    return this.loading ??= new Promise<Turnstile>((resolve, reject) => {
      const browser = this.document.defaultView as TurnstileWindow | null;
      if (!browser) {
        reject(new Error('Turnstile requires a browser'));
        return;
      }

      const script = this.document.createElement('script');
      const fail = () => {
        delete browser.onColiclicTurnstileLoad;
        script.remove();
        reject(new Error('Turnstile could not be loaded'));
      };
      browser.onColiclicTurnstileLoad = () => {
        if (!browser.turnstile) {
          fail();
          return;
        }
        delete browser.onColiclicTurnstileLoad;
        resolve(browser.turnstile);
      };
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onColiclicTurnstileLoad';
      script.async = true;
      script.onerror = fail;
      this.document.head.append(script);
    }).catch((error: unknown) => {
      this.loading = undefined;
      throw error;
    });
  }
}
