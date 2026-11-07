import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PhotoUrlService {
  private readonly apiPrefix = '/api';

  normalizePhotoUrl(photoUrl?: string | null): string | undefined {
    const sanitizedPhotoUrl = photoUrl?.trim();
    if (!sanitizedPhotoUrl) {
      return undefined;
    }

    if (
      sanitizedPhotoUrl.startsWith('http://')
      || sanitizedPhotoUrl.startsWith('https://')
      || sanitizedPhotoUrl.startsWith('data:')
      || sanitizedPhotoUrl.startsWith('blob:')
      || sanitizedPhotoUrl.startsWith(`${this.apiPrefix}/`)
    ) {
      return sanitizedPhotoUrl;
    }

    if (sanitizedPhotoUrl.startsWith('/uploads/')) {
      return `${this.apiPrefix}${sanitizedPhotoUrl}`;
    }

    if (sanitizedPhotoUrl.startsWith('uploads/')) {
      return `${this.apiPrefix}/${sanitizedPhotoUrl}`;
    }

    return sanitizedPhotoUrl;
  }
}
