import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Location } from '@angular/common';
import { of } from 'rxjs';
import { MessagesPageComponent } from './messages-page.component';
import { MessagingService } from '../../services/messaging.service';
import { AuthService } from '../../services/auth.service';

describe('MessagesPageComponent', () => {
  let component: MessagesPageComponent;
  let router: Router;
  let locationSpy: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    const messagingServiceSpy = jasmine.createSpyObj<MessagingService>('MessagingService', [
      'getConversations',
      'getMessages',
      'sendMessage',
    ]);
    messagingServiceSpy.getConversations.and.returnValue(of([]));
    messagingServiceSpy.getMessages.and.returnValue(of([]));

    const authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['isLoggedIn', 'getUser']);
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.getUser.and.returnValue({ id: 1 } as any);

    locationSpy = jasmine.createSpyObj<Location>('Location', ['back']);

    await TestBed.configureTestingModule({
      imports: [MessagesPageComponent],
      providers: [
        provideRouter([]),
        { provide: MessagingService, useValue: messagingServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Location, useValue: locationSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(MessagesPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('goToPreviousPage should go back when browser history exists', () => {
    spyOnProperty(window.history, 'length', 'get').and.returnValue(2);

    component.goToPreviousPage();

    expect(locationSpy.back).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('goToPreviousPage should fallback to dashboard when browser history does not exist', () => {
    spyOnProperty(window.history, 'length', 'get').and.returnValue(1);

    component.goToPreviousPage();

    expect(locationSpy.back).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
