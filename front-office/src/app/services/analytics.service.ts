import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { AppConfigService } from './app-config.service';

export type AnalyticsEventName =
  | 'search_started'
  | 'results_displayed'
  | 'detail_opened'
  | 'request_started'
  | 'request_submitted';

type AnalyticsParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly appConfig = inject(AppConfigService);
  private readonly consentKey = 'coliclic.analytics.consent';
  private loaded = false;
  readonly consentRequired = signal(this.readConsent() === null);

  accept(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.consentKey, 'granted');
    this.consentRequired.set(false);
    this.load();
  }

  decline(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.consentKey, 'denied');
    this.consentRequired.set(false);
  }

  track(name: AnalyticsEventName, params: AnalyticsParams = {}): void {
    if (!isPlatformBrowser(this.platformId) || this.readConsent() !== 'granted') return;
    this.load();
    window.gtag?.('event', name, this.cleanParams(params));
  }

  private load(): void {
    if (this.loaded || !isPlatformBrowser(this.platformId)) return;
    const measurementId = this.appConfig.config().analyticsMeasurementId;
    if (!measurementId) return;

    window.dataLayer = window.dataLayer ?? [];
    window.gtag = window.gtag ?? ((...args: unknown[]) => window.dataLayer!.push({ event: 'gtag', args }));
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { anonymize_ip: true });
    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    this.document.head.appendChild(script);
    this.loaded = true;
  }

  private readConsent(): 'granted' | 'denied' | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const value = localStorage.getItem(this.consentKey);
    return value === 'granted' || value === 'denied' ? value : null;
  }

  private cleanParams(params: AnalyticsParams): AnalyticsParams {
    return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
  }
}
