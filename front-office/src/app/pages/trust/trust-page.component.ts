import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TRUST_DOCUMENTS } from './trust-documents';
import { TrustDocumentSlug } from './trust-document.model';
import { TrustPageLayoutComponent } from './trust-page-layout.component';

@Component({
  selector: 'app-trust-page',
  standalone: true,
  imports: [TrustPageLayoutComponent],
  template: '<app-trust-page-layout [document]="document" />',
})
export class TrustPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly document = TRUST_DOCUMENTS[this.route.snapshot.data['trustSlug'] as TrustDocumentSlug];
}
