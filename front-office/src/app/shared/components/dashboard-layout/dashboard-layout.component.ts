import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashboardShellComponent } from '../dashboard-shell/dashboard-shell.component';

/**
 * Layout wrapper component that provides the dashboard shell (sidebar + navbar)
 * around a router-outlet for all authenticated dashboard pages.
 */
@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, DashboardShellComponent],
  template: `
    <app-dashboard-shell>
      <router-outlet />
    </app-dashboard-shell>
  `,
})
export class DashboardLayoutComponent {}
