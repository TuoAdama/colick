import { Component, inject, OnInit, OnDestroy, PLATFORM_ID, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessagingService } from '../../services/messaging.service';
import { AuthService } from '../../services/auth.service';
import { ConversationResponse, MessageResponse } from '../../models/messaging.model';
@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages-page.component.html',
  styleUrl: './messages-page.component.css',
  host: { '[style.--messages-viewport-height]': 'viewportHeight' },
})
export class MessagesPageComponent implements OnInit, OnDestroy, AfterViewChecked {
  private readonly messagingService = inject(MessagingService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly platformId = inject(PLATFORM_ID);
  conversations: ConversationResponse[] = [];
  selectedConversation: ConversationResponse | null = null;
  messages: MessageResponse[] = [];
  newMessage = '';
  isLoadingConversations = false;
  isLoadingMessages = false;
  isSending = false;
  errorMessage = '';
  currentUserId: number | null = null;
  isMobile = false;
  viewportHeight = '100dvh';
  @ViewChild('messageHistory') private messageHistory?: ElementRef<HTMLElement>;
  private scrollToLatest = false;
  private scrollFrame: number | null = null;
  private historyResizeObserver: ResizeObserver | null = null;
  private observedHistory?: HTMLElement;
  private followLatest = true;
  private pendingConversationId: number | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private readonly resizeListener = (): void => {
    this.updateViewportState();
  };

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) { this.router.navigate(['/login']); return; }
    const user = this.authService.getUser();
    this.currentUserId = user?.id ?? null;
    if (isPlatformBrowser(this.platformId)) {
      this.updateViewportState();
      window.addEventListener('resize', this.resizeListener);
      window.visualViewport?.addEventListener('resize', this.resizeListener);
    }
    const conversationIdParam = this.route.snapshot.queryParamMap.get('conversationId');
    if (conversationIdParam) {
      const parsed = Number(conversationIdParam);
      if (Number.isInteger(parsed) && parsed > 0) {
        this.pendingConversationId = parsed;
      }
    }
    this.loadConversations();
  }
  ngOnDestroy(): void {
    this.stopPolling();
    this.historyResizeObserver?.disconnect();
    if (this.scrollFrame !== null) cancelAnimationFrame(this.scrollFrame);
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.resizeListener);
      window.visualViewport?.removeEventListener('resize', this.resizeListener);
    }
  }
  loadConversations(): void {
    this.isLoadingConversations = true;
    this.messagingService.getConversations().subscribe({
      next: (c) => {
        this.conversations = c;
        this.isLoadingConversations = false;
        if (this.pendingConversationId) {
          const target = c.find((conv) => conv.id === this.pendingConversationId);
          this.pendingConversationId = null;
          if (target) {
            this.selectConversation(target);
          }
        }
      },
      error: () => { this.errorMessage = 'Impossible de charger les conversations.'; this.isLoadingConversations = false; },
    });
  }
  selectConversation(c: ConversationResponse): void { this.selectedConversation = c; this.followLatest = true; this.scrollToLatest = true; this.loadMessages(c.id); this.startPolling(c.id); }
  loadMessages(id: number): void {
    this.isLoadingMessages = true;
    this.messagingService.getMessages(id).subscribe({
      next: (m) => { this.messages = m; this.scrollToLatest = true; this.isLoadingMessages = false; const cv = this.conversations.find((x) => x.id === id); if (cv) cv.unreadCount = 0; },
      error: () => { this.errorMessage = 'Impossible de charger les messages.'; this.isLoadingMessages = false; },
    });
  }
  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation || this.isSending) return;
    this.isSending = true;
    this.messagingService.sendMessage(this.selectedConversation.id, this.newMessage.trim()).subscribe({
      next: (m) => { this.messages.push(m); this.scrollToLatest = true; this.newMessage = ''; this.isSending = false; if (this.selectedConversation) this.selectedConversation.lastMessage = m.content; },
      error: () => { this.errorMessage = "Erreur lors de l'envoi."; this.isSending = false; },
    });
  }
  private startPolling(id: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      this.messagingService.getMessages(id).subscribe({ next: (m) => { this.scrollToLatest = this.isNearLatestMessage(); this.messages = m; } });
    }, 5000);
  }
  private stopPolling(): void { if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; } }
  isOwnMessage(m: MessageResponse): boolean { return m.senderId === this.currentUserId; }
  formatTime(d: string): string { return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  goToPreviousPage(): void {
    if (isPlatformBrowser(this.platformId) && window.history.length > 1) {
      this.location.back();
      return;
    }
    this.router.navigate(['/dashboard']);
  }
  goBack(): void { this.selectedConversation = null; this.messages = []; this.stopPolling(); this.loadConversations(); }

  ngAfterViewChecked(): void {
    const history = this.messageHistory?.nativeElement;
    if (history !== this.observedHistory) {
      this.historyResizeObserver?.disconnect();
      this.observedHistory = history;
      if (history && isPlatformBrowser(this.platformId) && typeof ResizeObserver !== 'undefined') {
        // Production styles and fonts may settle after the message view is rendered.
        this.historyResizeObserver = new ResizeObserver(() => {
          if (this.isMobile && this.followLatest) history.scrollTop = history.scrollHeight;
        });
        this.historyResizeObserver.observe(history);
        if (history.firstElementChild) this.historyResizeObserver.observe(history.firstElementChild);
      }
    }
    if (isPlatformBrowser(this.platformId) && this.scrollToLatest && this.messageHistory && !this.isLoadingMessages) {
      if (this.scrollFrame !== null) cancelAnimationFrame(this.scrollFrame);
      this.scrollFrame = requestAnimationFrame(() => {
        this.scrollFrame = null;
        if (this.isMobile && this.messageHistory) {
          const history = this.messageHistory.nativeElement;
          this.followLatest = true;
          history.scrollTop = history.scrollHeight;
        }
      });
      this.scrollToLatest = false;
    }
  }

  onHistoryScroll(): void {
    this.followLatest = this.isNearLatestMessage();
  }

  private isNearLatestMessage(): boolean {
    const history = this.messageHistory?.nativeElement;
    return !history || history.scrollHeight - history.scrollTop - history.clientHeight < 64;
  }

  startsMessageDay(index: number): boolean {
    return index === 0 || new Date(this.messages[index - 1].sentAt).toDateString() !== new Date(this.messages[index].sentAt).toDateString();
  }

  formatMessageDay(sentAt: string): string {
    const date = new Date(sentAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Aujourd’hui';
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  onComposerEnter(event: Event): void {
    const keyboard = event as KeyboardEvent;
    if (keyboard.shiftKey || keyboard.isComposing) return;
    event.preventDefault();
    this.sendMessage();
  }

  private updateViewportState(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isMobile = window.innerWidth < 768;
    this.viewportHeight = window.visualViewport ? `${window.visualViewport.height}px` : '100dvh';
  }
}
