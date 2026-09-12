import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, TransferState, inject, makeStateKey, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FREE_APP_CONFIG, PublicAppConfig } from '../models/app-config.model';

export const APP_CONFIG_STATE_KEY = makeStateKey<PublicAppConfig>('public-app-config');

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly currentConfig = signal<PublicAppConfig>(FREE_APP_CONFIG);

  readonly config = this.currentConfig.asReadonly();

  async initialize(): Promise<void> {
    if (this.transferState.hasKey(APP_CONFIG_STATE_KEY)) {
      this.currentConfig.set(this.normalize(this.transferState.get(APP_CONFIG_STATE_KEY, FREE_APP_CONFIG)));
      this.transferState.remove(APP_CONFIG_STATE_KEY);
      return;
    }

    if (!this.http) {
      this.currentConfig.set(FREE_APP_CONFIG);
      return;
    }

    try {
      const config = this.normalize(await firstValueFrom(
        this.http.get<PublicAppConfig>('/api/public/app-config'),
      ));
      this.currentConfig.set(config);
      if (isPlatformServer(this.platformId)) {
        this.transferState.set(APP_CONFIG_STATE_KEY, config);
      }
    } catch {
      this.currentConfig.set(FREE_APP_CONFIG);
    }
  }

  private normalize(config: PublicAppConfig): PublicAppConfig {
    const isCommission = config?.commercialMode === 'COMMISSION'
      && config.contentVariant === 'commission'
      && config.platformFeeRate > 0
      && config.platformFeeRate <= 1
      && config.features?.platformFee === true
      && config.features?.platformPayment === true;

    return isCommission ? config : FREE_APP_CONFIG;
  }
}
