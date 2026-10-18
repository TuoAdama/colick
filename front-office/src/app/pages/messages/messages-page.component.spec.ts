import { ComponentFixture, fakeAsync, tick, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { Location } from '@angular/common';
import { of, Subject, throwError } from 'rxjs';
import { ConversationResponse, MessageResponse } from '../../models/messaging.model';
import { MessagesPageComponent } from './messages-page.component';
import { MessagingService } from '../../services/messaging.service';
import { AuthService } from '../../services/auth.service';

describe('MessagesPageComponent', () => {
  let component: MessagesPageComponent;
  let router: Router;
  let fixture: ComponentFixture<MessagesPageComponent>;
  let messaging: jasmine.SpyObj<MessagingService>;
  const conversation: ConversationResponse = { id: 10, otherParticipantId: 2, otherParticipantName: 'Demsi Demsi', contextRoute: 'Nantes → Abidjan', tripRoute: 'Paris → Dakar', lastMessage: null, unreadCount: 1, createdAt: '2026-10-01T10:00:00' };
  const message = (id: number, senderId = 2, sentAt = '2026-10-18T06:24:00'): MessageResponse => ({ id, senderId, sentAt, senderName: 'Demsi', content: 'Bonjour', read: true });
  const openConversation = (): void => {
    fixture.detectChanges();
    component.isMobile = true;
    component.selectConversation({ ...conversation });
    fixture.detectChanges();
  };
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

    messaging = messagingServiceSpy;
    fixture = TestBed.createComponent(MessagesPageComponent);
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
  it('opens a conversation from its query parameter and clears its unread count', () => {
    spyOn(TestBed.inject(ActivatedRoute).snapshot.queryParamMap, 'get').and.returnValue('10');
    messaging.getConversations.and.returnValue(of([{ ...conversation }]));
    messaging.getMessages.and.returnValue(of([message(1)]));
    fixture.detectChanges();
    expect(component.selectedConversation?.id).toBe(10);
    expect(component.conversations[0].unreadCount).toBe(0);
    expect(component.messages.length).toBe(1);
  });

  it('shows loading, then empty and failed message states without removing the composer', () => {
    const response = new Subject<MessageResponse[]>();
    messaging.getMessages.and.returnValue(response);
    openConversation();
    expect(fixture.nativeElement.querySelector('.message-history .animate-spin')).not.toBeNull();
    response.next([]); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.message-history').textContent).toContain('Aucun message.');
    response.error(new Error('offline')); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Impossible de charger les messages.');
    expect(fixture.nativeElement.querySelector('.message-composer')).not.toBeNull();
  });

  it('renders context, ownership and outside timestamps, then returns to conversations', () => {
    messaging.getMessages.and.returnValue(of([message(1), message(2, 1)]));
    openConversation();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('.contact-route')?.textContent).toContain('Nantes → Abidjan');
    expect(host.querySelectorAll('.own-message').length).toBe(1);
    expect(host.querySelectorAll('.message-time').length).toBe(2);
    expect(host.querySelector('.message-bubble .message-time')).toBeNull();
    expect(host.querySelector('input[type="file"]')).toBeNull();
    (host.querySelector('.messages-title button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.selectedConversation).toBeNull();
    expect(host.querySelector('.message-composer')).toBeNull();
  });
  it('falls back to the trip route and omits an absent route', () => {
    openConversation();
    component.selectedConversation = { ...conversation, contextRoute: '' };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.contact-route').textContent).toContain('Paris → Dakar');
    component.selectedConversation = { ...conversation, contextRoute: '', tripRoute: null };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.contact-route')).toBeNull();
  });
  it('groups local dates, including yesterday across a month boundary', () => {
    jasmine.clock().install();
    try {
      jasmine.clock().mockDate(new Date(2026, 10, 1, 12));
      expect(component.formatMessageDay('2026-11-01T01:00:00')).toBe('Aujourd’hui');
      expect(component.formatMessageDay('2026-10-31T23:59:00')).toBe('Hier');
      expect(component.formatMessageDay('2026-10-29T12:00:00')).toBe('29 octobre 2026');
      component.messages = [message(1, 2, '2026-10-31T12:00:00'), message(2, 1, '2026-10-31T13:00:00'), message(3, 2, '2026-11-01T01:00:00')];
      expect([0, 1, 2].map(index => component.startsMessageDay(index))).toEqual([true, false, true]);
    } finally { jasmine.clock().uninstall(); }
  });
  it('prevents empty and duplicate sends and clears the draft only after success', () => {
    openConversation();
    const response = new Subject<MessageResponse>();
    messaging.sendMessage.and.returnValue(response);
    component.newMessage = '   ';
    component.sendMessage();
    expect(messaging.sendMessage).not.toHaveBeenCalled();
    component.newMessage = ' Bonjour  ';
    component.sendMessage(); component.sendMessage();
    expect(messaging.sendMessage).toHaveBeenCalledOnceWith(10, 'Bonjour');
    expect(component.newMessage).toBe(' Bonjour  ');
    response.next(message(3, 1));
    expect(component.newMessage).toBe('');
    expect(component.isSending).toBeFalse();
  });
  it('preserves the draft on sending failure', () => {
    openConversation();
    messaging.sendMessage.and.returnValue(throwError(() => new Error('offline')));
    component.newMessage = 'Mon brouillon'; component.sendMessage(); fixture.detectChanges();
    expect(component.newMessage).toBe('Mon brouillon');
    expect(component.isSending).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain("Erreur lors de l'envoi.");
  });
  it('allows Shift+Enter and composition without sending', () => {
    const send = spyOn(component, 'sendMessage');
    component.onComposerEnter(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true }));
    component.onComposerEnter(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true }));
    expect(send).not.toHaveBeenCalled();
    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    component.onComposerEnter(enter);
    expect(send).toHaveBeenCalledTimes(1);
    expect(enter.defaultPrevented).toBeTrue();
  });
  it('scrolls on opening and sending, preserving reading position during polling', fakeAsync(() => {
    openConversation();
    const history: HTMLElement = fixture.nativeElement.querySelector('.message-history');
    Object.defineProperty(history, 'scrollTop', { configurable: true, writable: true, value: 0 });
    Object.defineProperty(history, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(history, 'clientHeight', { configurable: true, value: 200 });
    component.loadMessages(10); fixture.detectChanges(); tick(16);
    expect(history.scrollTop).toBe(1000);
    history.scrollTop = 100; tick(5000); fixture.detectChanges(); tick(16);
    expect(history.scrollTop).toBe(100);
    history.scrollTop = 800; tick(5000); fixture.detectChanges(); tick(16);
    expect(history.scrollTop).toBe(1000);
    history.scrollTop = 100;
    messaging.sendMessage.and.returnValue(of(message(3, 1)));
    component.newMessage = 'Message'; component.sendMessage(); fixture.detectChanges(); tick(16);
    expect(history.scrollTop).toBe(1000);
    component.goBack();
    const count = messaging.getMessages.calls.count(); tick(5000);
    expect(messaging.getMessages.calls.count()).toBe(count);
  }));
  it('keeps date separators out of desktop', () => {
    messaging.getMessages.and.returnValue(of([message(1)])); openConversation();
    component.isMobile = false; fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.message-day')).toBeNull();
  });
});
