import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type State = 'ready' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-confirm-email-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './confirm-email-page.component.html',
})
export class ConfirmEmailPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  state: State = 'ready';
  email = '';
  private token: string | null = null;

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) this.state = 'error';
  }

  confirm(): void {
    if (!this.token || this.state !== 'ready') return;
    this.state = 'loading';
    this.authService.confirmEmail(this.token).subscribe({
      next: (user) => {
        this.email = user.email;
        this.state = 'success';
      },
      error: () => { this.state = 'error'; },
    });
  }
}
