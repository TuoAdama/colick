import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppConfigService } from '../../services/app-config.service';
import { trustDocumentFor } from './trust-documents';
import { TrustDocumentSlug } from './trust-document.model';
import { TrustPageLayoutComponent } from './trust-page-layout.component';

@Component({
  selector: 'app-trust-page',
  standalone: true,
  imports: [TrustPageLayoutComponent],
  template: '<app-trust-page-layout [document]="document()" />',
})
export class TrustPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly appConfig = inject(AppConfigService);
  private readonly slug = this.route.snapshot.data['trustSlug'] as TrustDocumentSlug;
  readonly document = computed(() => trustDocumentFor(
    this.slug,
    this.appConfig.config().contentVariant,
  ));
}
