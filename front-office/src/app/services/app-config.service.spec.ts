import { PLATFORM_ID, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { COMMERCIAL_CONTENT } from './commercial-content.service';
import { APP_CONFIG_STATE_KEY, AppConfigService } from './app-config.service';
import { PublicAppConfig } from '../models/app-config.model';

const COMMISSION_CONFIG: PublicAppConfig = {
  commercialMode: 'COMMISSION',
  platformFeeRate: 0.07,
  features: { platformPayment: true, platformFee: true },
  contentVariant: 'commission',
};

describe('AppConfigService', () => {
  let service: AppConfigService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    service = TestBed.inject(AppConfigService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads a valid commission profile', async () => {
    const initialization = service.initialize();
    httpTesting.expectOne('/api/public/app-config').flush(COMMISSION_CONFIG);

    await initialization;

    expect(service.config()).toEqual(COMMISSION_CONFIG);
    expect(COMMERCIAL_CONTENT[service.config().contentVariant].bookingFeeLabel).toContain('7 %');
  });

  it('falls back to the free profile when loading fails', async () => {
    const initialization = service.initialize();
    httpTesting.expectOne('/api/public/app-config').flush('Unavailable', {
      status: 503,
      statusText: 'Unavailable',
    });

    await initialization;

    expect(service.config().commercialMode).toBe('FREE');
    expect(service.config().platformFeeRate).toBe(0);
    expect(service.config().features.platformPayment).toBeFalse();
  });

  it('reuses transferred SSR state without another request', async () => {
    TestBed.inject(TransferState).set(APP_CONFIG_STATE_KEY, COMMISSION_CONFIG);

    await service.initialize();

    expect(service.config()).toEqual(COMMISSION_CONFIG);
    httpTesting.expectNone('/api/public/app-config');
  });

  it('rejects inconsistent paid configuration and fails closed', async () => {
    const initialization = service.initialize();
    httpTesting.expectOne('/api/public/app-config').flush({
      ...COMMISSION_CONFIG,
      platformFeeRate: 0,
    });

    await initialization;

    expect(service.config().commercialMode).toBe('FREE');
  });
});
