import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessagingService } from '../../services/messaging.service';
import { AuthService } from '../../services/auth.service';
import { ConversationResponse, MessageResponse } from '../../models/messaging.model';
@Component({ selector: 'app-messages-page', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './messages-page.component.html' })
export class MessagesPageComponent implements OnInit, OnDestroy {
  private readonly messagingService = inject(MessagingService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
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
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private readonly resizeListener = (): void => {
    this.updateViewportState();
  };

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) { this.router.navigate(['/login']); return; }
    const user = this.authService.getUser();
    this.currentUserId = user?.id ?? null;
    this.updateViewportState();
    window.addEventListener('resize', this.resizeListener);
    this.loadConversations();
  }
  ngOnDestroy(): void {
    this.stopPolling();
    window.removeEventListener('resize', this.resizeListener);
  }
  loadConversations(): void {
    this.isLoadingConversations = true;
    this.messagingService.getConversations().subscribe({
      next: (c) => { this.conversations = c; this.isLoadingConversations = false; },
      error: () => { this.errorMessage = 'Impossible de charger les conversations.'; this.isLoadingConversations = false; },
    });
  }
  selectConversation(c: ConversationResponse): void { this.selectedConversation = c; this.loadMessages(c.id); this.startPolling(c.id); }
  loadMessages(id: number): void {
    this.isLoadingMessages = true;
    this.messagingService.getMessages(id).subscribe({
      next: (m) => { this.messages = m; this.isLoadingMessages = false; const cv = this.conversations.find((x) => x.id === id); if (cv) cv.unreadCount = 0; },
      error: () => { this.errorMessage = 'Impossible de charger les messages.'; this.isLoadingMessages = false; },
    });
  }
  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation || this.isSending) return;
    this.isSending = true;
    this.messagingService.sendMessage(this.selectedConversation.id, this.newMessage.trim()).subscribe({
      next: (m) => { this.messages.push(m); this.newMessage = ''; this.isSending = false; if (this.selectedConversation) this.selectedConversation.lastMessage = m.content; },
      error: () => { this.errorMessage = "Erreur lors de l'envoi."; this.isSending = false; },
    });
  }
  private startPolling(id: number): void { this.stopPolling(); this.pollInterval = setInterval(() => { this.messagingService.getMessages(id).subscribe({ next: (m) => { this.messages = m; } }); }, 5000); }
  private stopPolling(): void { if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; } }
  isOwnMessage(m: MessageResponse): boolean { return m.senderId === this.currentUserId; }
  formatTime(d: string): string { return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  goToPreviousPage(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    this.router.navigate(['/dashboard']);
  }
  goBack(): void { this.selectedConversation = null; this.messages = []; this.stopPolling(); this.loadConversations(); }

  private updateViewportState(): void {
    this.isMobile = window.innerWidth < 768;
  }
}
