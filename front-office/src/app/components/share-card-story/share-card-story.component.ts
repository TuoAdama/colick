import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { ShareCardData } from '../../models/share-card.model';
import { CommercialContentService } from '../../services/commercial-content.service';

@Component({
  selector: 'app-share-card-story',
  standalone: true,
  templateUrl: './share-card-story.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareCardStoryComponent {
  readonly commercialContent = inject(CommercialContentService);
  @Input() data: ShareCardData | null = null;
}
