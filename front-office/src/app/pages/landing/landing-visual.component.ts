import { Component, Input } from '@angular/core';
import { LandingIllustration } from './landing-illustrations';

@Component({
  selector: 'app-landing-visual',
  standalone: true,
  templateUrl: './landing-visual.component.html',
  styleUrl: './landing-visual.component.css',
})
export class LandingVisualComponent {
  @Input() illustration?: LandingIllustration;
}
