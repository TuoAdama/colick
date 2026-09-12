import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ShareCardData } from '../../models/share-card.model';

@Component({
  selector: 'app-share-card-story',
  standalone: true,
  templateUrl: './share-card-story.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareCardStoryComponent {
  @Input() data: ShareCardData | null = null;
}
