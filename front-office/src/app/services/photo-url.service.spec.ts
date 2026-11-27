import { TestBed } from '@angular/core/testing';
import { PhotoUrlService } from './photo-url.service';

describe('PhotoUrlService', () => {
  let service: PhotoUrlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhotoUrlService);
  });

  it('returns undefined when the photo URL is empty', () => {
    expect(service.normalizePhotoUrl('')).toBeUndefined();
    expect(service.normalizePhotoUrl('   ')).toBeUndefined();
    expect(service.normalizePhotoUrl(undefined)).toBeUndefined();
  });

  it('keeps already absolute URLs unchanged', () => {
    expect(service.normalizePhotoUrl('https://cdn.example.com/photo.png')).toBe(
      'https://cdn.example.com/photo.png'
    );
    expect(service.normalizePhotoUrl('/api/uploads/photo.png')).toBe('/api/uploads/photo.png');
  });

  it('prefixes relative upload URLs with the API base path', () => {
    expect(service.normalizePhotoUrl('/uploads/photo.png')).toBe('/api/uploads/photo.png');
    expect(service.normalizePhotoUrl('uploads/photo.png')).toBe('/api/uploads/photo.png');
  });
});
