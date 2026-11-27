import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * StatsComponent - Statistics section displaying key metrics.
 * Shows packages delivered, active travelers, destinations, and average rating.
 */
@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.component.html',
})
export class StatsComponent {
  /**
   * Statistics to display in the section
   */
  stats: Array<{ value: string; label: string }> = [];
}
