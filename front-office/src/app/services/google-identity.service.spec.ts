import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { GoogleIdentityService } from './google-identity.service';

describe('GoogleIdentityService', () => {
  let service: GoogleIdentityService;
  const authServiceMock = {
    getGoogleAuthConfig: jasmine.createSpy('getGoogleAuthConfig'),
  };

  beforeEach(() => {
    authServiceMock.getGoogleAuthConfig.and.returnValue(of({ enabled: true, clientId: 'google-client-id' }));
    (window as any).google = {
      accounts: {
        id: {
          initialize: jasmine.createSpy('initialize'),
          renderButton: jasmine.createSpy('renderButton'),
        },
      },
    };

    TestBed.configureTestingModule({
      providers: [
        GoogleIdentityService,
        { provide: AuthService, useValue: authServiceMock },
      ],
    });
    service = TestBed.inject(GoogleIdentityService);
  });

  afterEach(() => {
    delete (window as any).google;
  });

  it('fits the Google widget to the available mobile width', async () => {
    const hostElement = document.createElement('div');
    Object.defineProperty(hostElement, 'clientWidth', { configurable: true, value: 280 });

    await service.renderButton(hostElement, 'signup_with', jasmine.createSpy('onCredential'));

    expect(window.google?.accounts.id.renderButton).toHaveBeenCalledWith(
      hostElement,
      jasmine.objectContaining({ width: 280 }),
    );
  });
});
