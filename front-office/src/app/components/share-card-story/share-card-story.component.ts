import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ShareCardData } from '../../models/share-card.model';

@Component({
  selector: 'app-share-card-story',
  standalone: true,
  templateUrl: './share-card-story.component.html',
  styleUrl: './share-card-story.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareCardStoryComponent {
  @Input() data: ShareCardData | null = null;

  cityFontSize(city?: string | null): number {
    const length = Array.from(city?.trim() || 'Destination').length;
    return length <= 8 ? 188 : length <= 12 ? 140 : length <= 18 ? 100 : 76;
  }

  metricFontSize(label?: string | null): number {
    const length = (label || '').length;
    return length <= 8 ? 96 : length <= 12 ? 74 : 56;
  }
}
