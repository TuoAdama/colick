import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PublicAppConfig } from '../../models/app-config.model';
import { AppConfigService } from '../../services/app-config.service';
import { COMMERCIAL_CONTENT, CommercialContentService } from '../../services/commercial-content.service';
import { PricingPageComponent } from './pricing-page.component';

describe('PricingPageComponent', () => {
  let fixture: ComponentFixture<PricingPageComponent>;
  const config = signal<PublicAppConfig>({
    commercialMode: 'FREE',
    platformFeeRate: 0,
    features: { platformPayment: false, platformFee: false },
    contentVariant: 'free',
  });

  beforeEach(async () => {
    config.set({
      commercialMode: 'FREE',
      platformFeeRate: 0,
      features: { platformPayment: false, platformFee: false },
      contentVariant: 'free',
    });
    await TestBed.configureTestingModule({
      imports: [PricingPageComponent],
      providers: [
        provideRouter([]),
        { provide: AppConfigService, useValue: { config } },
        { provide: CommercialContentService, useValue: { content: signal(COMMERCIAL_CONTENT.free) } },
      ],
    }).compileComponents();
  });

  function render(): void {
    fixture = TestBed.createComponent(PricingPageComponent);
    fixture.detectChanges();
  }

  it('shows the free settlement and no platform fee', () => {
    render();

    expect(fixture.nativeElement.textContent).toContain('Plateforme gratuite');
    expect(fixture.componentInstance.grossAmount()).toBe(50);
    expect(fixture.componentInstance.feeAmount()).toBe(0);
    expect(fixture.componentInstance.netAmount()).toBe(50);
  });

  it('derives commission amounts from the public configuration', () => {
    config.set({
      commercialMode: 'COMMISSION',
      platformFeeRate: 0.07,
      features: { platformPayment: true, platformFee: true },
      contentVariant: 'commission',
    });
    render();

    expect(fixture.nativeElement.textContent).toContain('Commission');
    expect(fixture.componentInstance.feeAmount()).toBeCloseTo(3.5, 5);
    expect(fixture.componentInstance.netAmount()).toBeCloseTo(46.5, 5);
  });
});
