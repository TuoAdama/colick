import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AnalyticsService } from './analytics.service';
import { AppConfigService } from './app-config.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let gtag: jasmine.Spy;

  beforeEach(() => {
    localStorage.removeItem('coliclic.analytics.consent');
    gtag = jasmine.createSpy('gtag');
    (window as Window & { gtag?: (...args: unknown[]) => void }).gtag = gtag;
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: AppConfigService, useValue: { config: () => ({ analyticsMeasurementId: null }) } },
      ],
    });
    service = TestBed.inject(AnalyticsService);
  });

  afterEach(() => {
    localStorage.removeItem('coliclic.analytics.consent');
    delete (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  });

  it('does not emit events before consent', () => {
    service.track('search_started', { departure: 'Paris' });
    expect(gtag).not.toHaveBeenCalled();
  });

  it('emits the event after consent without personal data', () => {
    service.accept();
    service.track('request_submitted', { trip_id: 4, booking_id: 8, status: 'PENDING' });

    expect(gtag).toHaveBeenCalledWith('event', 'request_submitted', {
      trip_id: 4, booking_id: 8, status: 'PENDING',
    });
  });
});
