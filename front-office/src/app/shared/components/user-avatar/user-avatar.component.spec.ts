import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserAvatarComponent } from './user-avatar.component';

describe('UserAvatarComponent', () => {
  let fixture: ComponentFixture<UserAvatarComponent>;
  let component: UserAvatarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAvatarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserAvatarComponent);
    component = fixture.componentInstance;
  });

  it('renders the user photo when a URL is provided', () => {
    fixture.componentRef.setInput('name', 'Alice Martin');
    fixture.componentRef.setInput('photoUrl', '/api/uploads/alice.png');

    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement | null;
    expect(image?.src).toContain('/api/uploads/alice.png');
    expect(image?.alt).toBe('Photo de profil de Alice Martin');
  });

  it('falls back to initials when the photo URL is missing', () => {
    fixture.componentRef.setInput('name', 'Alice Martin');

    fixture.detectChanges();

    const fallback = fixture.nativeElement.querySelector('[data-testid="user-avatar-fallback"]');
    expect(fallback?.textContent?.trim()).toBe('AM');
  });

  it('falls back to initials after an image loading error', () => {
    fixture.componentRef.setInput('name', 'Alice Martin');
    fixture.componentRef.setInput('photoUrl', '/api/uploads/alice.png');

    fixture.detectChanges();
    component.onImageError();
    fixture.detectChanges();

    const fallback = fixture.nativeElement.querySelector('[data-testid="user-avatar-fallback"]');
    expect(fallback?.textContent?.trim()).toBe('AM');
  });
});
