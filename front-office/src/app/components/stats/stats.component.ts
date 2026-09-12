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
  stats = [
    { value: '5000+', label: 'Colis livrés' },
    { value: '1200+', label: 'Voyageurs actifs' },
    { value: '50+', label: 'Destinations' },
    { value: '4.8/5', label: 'Note moyenne' },
  ];
}
