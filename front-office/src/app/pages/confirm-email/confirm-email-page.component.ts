import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type State = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-confirm-email-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './confirm-email-page.component.html',
})
export class ConfirmEmailPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  state: State = 'loading';
  newEmail = '';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) { this.state = 'error'; return; }
    this.authService.confirmEmailChange(token).subscribe({
      next: (user) => {
        this.newEmail = user.email;
        this.state = 'success';
      },
      error: () => { this.state = 'error'; },
    });
  }
}
