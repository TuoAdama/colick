import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GoogleAuthButtonComponent } from './google-auth-button.component';
import { GoogleIdentityService } from '../../services/google-identity.service';

describe('GoogleAuthButtonComponent', () => {
  let fixture: ComponentFixture<GoogleAuthButtonComponent>;
  let component: GoogleAuthButtonComponent;

  const googleIdentityServiceMock = {
    renderButton: jasmine.createSpy('renderButton').and.resolveTo(true),
  };

  async function createComponent(): Promise<void> {
    fixture = TestBed.createComponent(GoogleAuthButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    googleIdentityServiceMock.renderButton.calls.reset();
    googleIdentityServiceMock.renderButton.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [GoogleAuthButtonComponent],
      providers: [
        { provide: GoogleIdentityService, useValue: googleIdentityServiceMock },
      ],
    }).compileComponents();
  });

  it('renders the Google button when configuration is available', async () => {
    await createComponent();

    expect(googleIdentityServiceMock.renderButton).toHaveBeenCalled();
    expect(component.isVisible).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('ou');

    const host = fixture.nativeElement.querySelector('.flex.justify-center > div') as HTMLElement;
    const buttonWrapper = host.parentElement as HTMLElement;
    expect(buttonWrapper.className).toContain('justify-center');
    expect(host.className).toContain('max-w-[360px]');
    expect(buttonWrapper.className).toContain('min-w-0');
    expect(buttonWrapper.className).toContain('overflow-hidden');
    expect(fixture.nativeElement.querySelector('.mt-4.space-y-4').classList.contains('hidden')).toBeFalse();
    expect(fixture.nativeElement.querySelector('.mt-4.space-y-4').classList.contains('invisible')).toBeFalse();
  });

  it('keeps the unresolved widget visually hidden while preserving its layout', async () => {
    let resolveRender!: (visible: boolean) => void;
    googleIdentityServiceMock.renderButton.and.returnValue(new Promise<boolean>((resolve) => {
      resolveRender = resolve;
    }));

    fixture = TestBed.createComponent(GoogleAuthButtonComponent);
    fixture.detectChanges();

    const section = fixture.nativeElement.querySelector('.mt-4.space-y-4') as HTMLElement;
    expect(section.classList.contains('invisible')).toBeTrue();
    expect(section.classList.contains('hidden')).toBeFalse();

    resolveRender(true);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(section.classList.contains('invisible')).toBeFalse();
  });

  it('stays hidden when Google auth is disabled in configuration', async () => {
    googleIdentityServiceMock.renderButton.and.resolveTo(false);

    await createComponent();

    expect(component.isVisible).toBeFalse();
    expect(component.errorMessage).toBe('');
    expect(fixture.nativeElement.querySelector('.mt-4.space-y-4').classList.contains('hidden')).toBeTrue();
  });

  it('shows an error message when button rendering fails', async () => {
    googleIdentityServiceMock.renderButton.and.rejectWith(new Error('Google indisponible'));

    await createComponent();

    expect(component.isVisible).toBeFalse();
    expect(component.errorMessage).toBe('Google indisponible');
    expect(fixture.nativeElement.textContent).toContain('Google indisponible');
  });
});
