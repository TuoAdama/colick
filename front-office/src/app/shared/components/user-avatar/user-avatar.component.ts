import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-avatar.component.html',
})
export class UserAvatarComponent implements OnChanges {
  @Input({ required: true }) name = '';
  @Input() photoUrl?: string | null;
  @Input() sizeClasses = 'w-10 h-10';
  @Input() textClasses = 'text-sm';

  displayPhotoUrl: string | null = null;

  ngOnChanges(): void {
    const sanitizedPhotoUrl = this.photoUrl?.trim() ?? '';
    this.displayPhotoUrl = sanitizedPhotoUrl || null;
  }

  get initials(): string {
    const nameParts = this.name
      .split(' ')
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 2);

    const initials = nameParts
      .map((part) => part.charAt(0).toUpperCase())
      .join('');

    return initials || 'U';
  }

  onImageError(): void {
    this.displayPhotoUrl = null;
  }
}
