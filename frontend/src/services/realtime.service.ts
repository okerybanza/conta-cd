import api from './api';

export type RealtimeEventType = 
  | 'invoice.created'
  | 'invoice.updated'
  | 'invoice.paid'
  | 'payment.received'
  | 'expense.created'
  | 'user.login'
  | 'notification.new'
  | 'approval.pending'
  | 'stock.low'
  | 'system.alert';

export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  data: any;
  timestamp: string;
  userId?: string;
  companyId?: string;
}

export type RealtimeEventHandler = (event: RealtimeEvent) => void;

class RealtimeService {
  private ws: WebSocket | null = null;
  private handlers: Map<RealtimeEventType | '*', Set<RealtimeEventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  async connect(token: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = this.getWebSocketUrl();

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${wsUrl}?token=${token}`);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
            this.handleEvent(realtimeEvent);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnecting = false;
          this.attemptReconnect(token);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
    this.reconnectAttempts = 0;
  }

  on(eventType: RealtimeEventType | '*', handler: RealtimeEventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  off(eventType: RealtimeEventType | '*', handler: RealtimeEventHandler): void {
    this.handlers.get(eventType)?.delete(handler);
  }

  send(eventType: string, data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: eventType, data }));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  private handleEvent(event: RealtimeEvent): void {
    // Call specific event handlers
    this.handlers.get(event.type)?.forEach(handler => handler(event));
    
    // Call wildcard handlers
    this.handlers.get('*')?.forEach(handler => handler(event));
  }

  private attemptReconnect(token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect(token).catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = process.env.NODE_ENV === 'production' ? '' : ':3001';
    return `${protocol}//${host}${port}/api/v1/realtime`;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export default new RealtimeService();
