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
  });

  it('stays hidden when Google auth is disabled in configuration', async () => {
    googleIdentityServiceMock.renderButton.and.resolveTo(false);

    await createComponent();

    expect(component.isVisible).toBeFalse();
    expect(component.errorMessage).toBe('');
  });

  it('shows an error message when button rendering fails', async () => {
    googleIdentityServiceMock.renderButton.and.rejectWith(new Error('Google indisponible'));

    await createComponent();

    expect(component.isVisible).toBeFalse();
    expect(component.errorMessage).toBe('Google indisponible');
    expect(fixture.nativeElement.textContent).toContain('Google indisponible');
  });
});
