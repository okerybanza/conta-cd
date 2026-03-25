import api from './api';

export interface PushSubscription {
  id: string;
  endpoint: string;
  deviceName?: string;
  browser?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface PushNotificationSettings {
  enabled: boolean;
  invoiceCreated?: boolean;
  invoicePaid?: boolean;
  paymentReceived?: boolean;
  expenseApproved?: boolean;
  lowStock?: boolean;
  systemAlerts?: boolean;
}

class WebPushService {
  private vapidPublicKey: string | null = null;

  async getVapidPublicKey(): Promise<string> {
    if (this.vapidPublicKey) {
      return this.vapidPublicKey;
    }

    const response = await api.get('/web-push/vapid-public-key');
    this.vapidPublicKey = response.data.publicKey || response.data.data?.publicKey;
    
    if (!this.vapidPublicKey) {
      throw new Error('VAPID public key not found');
    }
    
    return this.vapidPublicKey;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Push notifications not supported');
    }

    return await Notification.requestPermission();
  }

  async subscribe(): Promise<PushSubscription> {
    const permission = await this.requestPermission();
    
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    const registration = await navigator.serviceWorker.ready;
    const vapidPublicKey = await this.getVapidPublicKey();
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey) as BufferSource
    });

    const response = await api.post('/web-push/subscribe', {
      subscription: subscription.toJSON(),
      deviceName: this.getDeviceName(),
      browser: this.getBrowserName()
    });

    return response.data.data || response.data;
  }

  async unsubscribe(subscriptionId?: string): Promise<void> {
    if (subscriptionId) {
      await api.delete(`/web-push/unsubscribe/${subscriptionId}`);
    } else {
      // Unsubscribe current device
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await api.post('/web-push/unsubscribe', {
          endpoint: subscription.endpoint
        });
      }
    }
  }

  async getSubscriptions(): Promise<PushSubscription[]> {
    const response = await api.get('/web-push/subscriptions');
    return response.data.data || response.data;
  }

  async getSettings(): Promise<PushNotificationSettings> {
    const response = await api.get('/web-push/settings');
    return response.data.data || response.data;
  }

  async updateSettings(settings: Partial<PushNotificationSettings>): Promise<PushNotificationSettings> {
    const response = await api.put('/web-push/settings', settings);
    return response.data.data || response.data;
  }

  async testNotification(): Promise<void> {
    await api.post('/web-push/test');
  }

  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private getDeviceName(): string {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'Mobile';
    if (/tablet/i.test(ua)) return 'Tablet';
    return 'Desktop';
  }

  private getBrowserName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }
}

export default new WebPushService();
