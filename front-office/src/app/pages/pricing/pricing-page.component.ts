import { CurrencyPipe, PercentPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppConfigService } from '../../services/app-config.service';
import { CommercialContentService } from '../../services/commercial-content.service';

@Component({
  selector: 'app-pricing-page',
  standalone: true,
  imports: [CurrencyPipe, PercentPipe, RouterLink],
  templateUrl: './pricing-page.component.html',
})
export class PricingPageComponent {
  private readonly appConfig = inject(AppConfigService);
  readonly commercialContent = inject(CommercialContentService);
  readonly exampleWeight = 5;
  readonly examplePricePerKilo = 10;

  readonly config = this.appConfig.config;

  grossAmount(): number {
    return this.exampleWeight * this.examplePricePerKilo;
  }

  feeAmount(): number {
    return this.grossAmount() * this.config().platformFeeRate;
  }

  netAmount(): number {
    return this.grossAmount() - this.feeAmount();
  }
}
