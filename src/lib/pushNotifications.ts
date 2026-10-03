import { Order } from '../types';

/**
 * Checks if the browser / platform supports Notification and Service Worker APIs
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Returns current permission status: 'granted' | 'denied' | 'default' | 'unsupported'
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Requests Notification permission from the browser / device
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('[Push Notifications] Permission request failed:', err);
    return Notification.permission;
  }
}

/**
 * Triggers a device push notification for a new incoming customer order
 */
export async function sendOrderPushNotification(
  order: Order,
  shopName: string = 'CAIDOZ'
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const orderNum = order.id ? `#${order.id.slice(-4).toUpperCase()}` : '#NEW';
  const customer = order.customerName || 'Customer';
  const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || order.items?.length || 1;
  const totalStr = `₱${(order.total || 0).toLocaleString()}`;
  const orderType = order.orderType === 'dine-in' ? 'Dine In' : 'Takeout';

  const title = `🚨 New Order ${orderNum} Received!`;
  const body = `${customer} • ${itemCount} item${itemCount > 1 ? 's' : ''} (${totalStr}) • ${orderType}\nTap to open Kitchen Queue.`;

  // Vibration pattern: [vibrate, pause, vibrate, pause, long vibrate]
  const vibrationPattern = [200, 100, 200, 100, 300];

  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(vibrationPattern);
    }
  } catch {
    // Ignore vibration errors on non-supported hardware
  }

  try {
    // Attempt through Service Worker registration for PWA / background compatibility
    const registration = await navigator.serviceWorker.ready;
    if (registration && 'showNotification' in registration) {
      await registration.showNotification(title, {
        body,
        icon: '/icon-512.jpg',
        badge: '/icon-512.jpg',
        tag: `order-${order.id || Date.now()}`,
        data: {
          url: '/?view=cashier',
          view: 'cashier',
          orderId: order.id
        },
        vibrate: vibrationPattern,
        renotify: true,
        requireInteraction: true
      } as NotificationOptions);
      return true;
    }
  } catch (swErr) {
    console.warn('[Push Notifications] Service Worker showNotification failed, falling back to window Notification:', swErr);
  }

  // Fallback to standard Window Notification
  try {
    const notif = new Notification(title, {
      body,
      icon: '/icon-512.jpg',
      badge: '/icon-512.jpg',
      tag: `order-${order.id || Date.now()}`,
      data: {
        url: '/?view=cashier',
        view: 'cashier',
        orderId: order.id
      }
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (fallbackErr) {
    console.error('[Push Notifications] Window Notification failed:', fallbackErr);
    return false;
  }
}

/**
 * Sends a test push notification to verify sounds, vibration, and pop-up alerts on device
 */
export async function sendTestPushNotification(shopName: string = 'CAIDOZ'): Promise<boolean> {
  if (!isNotificationSupported()) {
    throw new Error('Notifications are not supported on this device/browser.');
  }

  if (Notification.permission !== 'granted') {
    const requested = await requestNotificationPermission();
    if (requested !== 'granted') {
      throw new Error('Notification permission was not granted. Please allow notifications in your browser settings.');
    }
  }

  const title = `🔔 ${shopName} Staff Alert Ready!`;
  const body = `Push notifications are active on this device. You will receive instant sound & vibration alerts for new orders!`;
  const vibrationPattern = [200, 100, 200, 100, 300];

  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(vibrationPattern);
    }
  } catch {}

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration && 'showNotification' in registration) {
      await registration.showNotification(title, {
        body,
        icon: '/icon-512.jpg',
        badge: '/icon-512.jpg',
        tag: `test-push-${Date.now()}`,
        data: {
          url: '/?view=settings',
          view: 'settings'
        },
        vibrate: vibrationPattern,
        renotify: true,
        requireInteraction: false
      } as NotificationOptions);
      return true;
    }
  } catch {}

  try {
    const notif = new Notification(title, {
      body,
      icon: '/icon-512.jpg',
      badge: '/icon-512.jpg',
      tag: `test-push-${Date.now()}`
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (err) {
    console.error('[Push Notifications] Test notification failed:', err);
    throw err;
  }
}
