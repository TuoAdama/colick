import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TrustDocument } from './trust-document.model';

@Component({
  selector: 'app-trust-page-layout',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './trust-page-layout.component.html',
})
export class TrustPageLayoutComponent {
  readonly document = input.required<TrustDocument>();
}
