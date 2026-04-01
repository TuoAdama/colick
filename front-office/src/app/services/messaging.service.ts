import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { ConversationResponse, MessageResponse, StartConversationRequest, SendMessageRequest } from '../models/messaging.model';
@Injectable({ providedIn: 'root' })
export class MessagingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/messaging';
  private readonly _unreadCount = new BehaviorSubject<number>(0);
  readonly unreadCount$ = this._unreadCount.asObservable();
  getConversations(): Observable<ConversationResponse[]> {
    return this.http.get<ConversationResponse[]>(`${this.baseUrl}/conversations`).pipe(
      tap((c) => { this._unreadCount.next(c.reduce((s, x) => s + x.unreadCount, 0)); })
    );
  }
  getMessages(id: number): Observable<MessageResponse[]> {
    return this.http.get<MessageResponse[]>(`${this.baseUrl}/conversations/${id}/messages`);
  }
  startConversation(req: StartConversationRequest): Observable<ConversationResponse> {
    return this.http.post<ConversationResponse>(`${this.baseUrl}/conversations`, req);
  }
  sendMessage(id: number, content: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/conversations/${id}/messages`, { content } as SendMessageRequest);
  }
  refreshUnreadCount(): void { this.getConversations().subscribe(); }
  resetUnreadCount(): void { this._unreadCount.next(0); }
}
