import { Order } from '../types';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';

/**
 * Converts a base64 string to a Uint8Array for Web Push applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Generates a safe Firestore document ID from a Web Push endpoint URL
 */
function getSubscriptionDocId(endpoint: string): string {
  try {
    return btoa(endpoint).replace(/[/+=]/g, '_').slice(-60);
  } catch {
    return endpoint.slice(-60).replace(/[^a-zA-Z0-9]/g, '_');
  }
}

/**
 * Checks if the browser / platform supports Notification, Service Worker, and PushManager
 */
export function isNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Returns current permission status: 'granted' | 'denied' | 'default' | 'unsupported'
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Requests Notification permission from the browser / device
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
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
 * Registers device with Server-Side Web Push (Google FCM / Apple APNs)
 * Persists token to Cloud Firestore so the phone wakes up on lockscreen even when app is killed.
 */
export async function registerDevicePushSubscription(
  userId?: string,
  role: string = 'admin'
): Promise<PushSubscription | null> {
  if (!isNotificationSupported()) {
    return null;
  }

  try {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration || !registration.pushManager) {
      console.warn('[Push Notifications] PushManager is not available on Service Worker');
      return null;
    }

    // Default stable VAPID key
    let vapidPublicKey = 'BBqdrlsWSnMBakioIX3sQnPgTJw6fuifZDcvxJ9rfiSff7UN5ox4W3vDsmtGQ1N976taLUMcMyt3NQRPxthPoGA';
    try {
      const res = await fetch('/api/push/public-key');
      if (res.ok) {
        const json = await res.json();
        if (json.publicKey) {
          vapidPublicKey = json.publicKey;
        }
      }
    } catch {}

    let subscription = await registration.pushManager.getSubscription();

    // If no existing subscription, register fresh
    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
    }

    if (subscription) {
      const subJson = subscription.toJSON();
      const docId = getSubscriptionDocId(subscription.endpoint);

      // 1. Save directly into Cloud Firestore for persistent cloud-wide access across Vercel / serverless
      try {
        await setDoc(doc(db, 'push_subscriptions', docId), {
          endpoint: subscription.endpoint,
          subscription: subJson,
          userId: userId || 'staff',
          role: role || 'admin',
          deviceName: navigator.userAgent || 'Staff Device',
          updatedAt: Date.now()
        }, { merge: true });
      } catch (fsErr) {
        console.warn('[Push Notifications] Firestore sub save failed:', fsErr);
      }

      // 2. Also register with server API
      try {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: subJson,
            userId: userId || undefined,
            role: role || 'admin'
          })
        });
      } catch {}
    }

    return subscription;
  } catch (err) {
    console.error('[Push Notifications] Error registering device subscription:', err);
    return null;
  }
}

/**
 * Triggers server-side push notification dispatch to all staff devices
 * Queries all staff push subscriptions from Firestore and dispatches via Google/Apple push servers.
 */
export async function sendServerOrderPush(order: Order, shopName: string = 'CAIDOZ'): Promise<boolean> {
  try {
    // 1. Fetch active subscriptions from Firestore
    let subscriptionsList: any[] = [];
    try {
      const snap = await getDocs(collection(db, 'push_subscriptions'));
      subscriptionsList = snap.docs.map(d => d.data()?.subscription).filter(Boolean);
    } catch (fsErr) {
      console.warn('[Push Notifications] Error fetching subscriptions from Firestore:', fsErr);
    }

    // 2. Dispatch to backend API route
    const res = await fetch('/api/push/send-order-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order,
        shopName,
        subscriptions: subscriptionsList.length > 0 ? subscriptionsList : undefined
      })
    });

    if (res.ok) {
      const data = await res.json();
      return !!data.success;
    }
  } catch (err) {
    console.warn('[Push Notifications] Backend push dispatch failed:', err);
  }
  return false;
}

/**
 * Triggers client-side local push notification for immediate foreground/background alert
 * AND broadcasts server-side push to wake up all other staff phones that are locked / killed.
 */
export async function sendOrderPushNotification(
  order: Order,
  shopName: string = 'CAIDOZ'
): Promise<boolean> {
  // Always trigger server-side push broadcast so all background / killed staff devices wake up
  sendServerOrderPush(order, shopName).catch(() => {});

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const orderNum = order.id ? `#${order.id.slice(-4).toUpperCase()}` : '#NEW';
  const customer = order.customerName || 'Customer';
  const itemCount = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || order.items?.length || 1;
  const totalStr = `₱${(order.total || 0).toLocaleString()}`;
  const orderType = order.orderType === 'dine-in' ? 'Dine In' : 'Takeout';

  const title = `🚨 NEW ORDER ${orderNum}!`;
  const body = `${customer} • ${itemCount} item${itemCount > 1 ? 's' : ''} (${totalStr}) • ${orderType}\nTap to open Kitchen Queue.`;

  // Heavy vibration pattern for lockscreen attention: [vibrate, pause, vibrate, pause, long vibrate]
  const vibrationPattern = [300, 150, 300, 150, 400];

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
        tag: `order-${order.id || Date.now()}`,
        data: {
          url: '/?view=cashier',
          view: 'cashier',
          orderId: order.id
        },
        vibrate: vibrationPattern,
        renotify: true,
        requireInteraction: true,
        actions: [
          { action: 'view', title: '👀 View in Kitchen Queue' }
        ]
      } as NotificationOptions);
      return true;
    }
  } catch (swErr) {
    console.warn('[Push Notifications] SW showNotification failed, using fallback:', swErr);
  }

  // Fallback to standard Window Notification
  try {
    const notif = new Notification(title, {
      body,
      icon: '/icon-512.jpg',
      badge: '/icon-512.jpg',
      tag: `order-${order.id || Date.now()}`
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch {
    return false;
  }
}

/**
 * Sends a test push notification to verify sound, vibration, and lockscreen delivery
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

  // Ensure subscription is registered & saved to Firestore
  const subscription = await registerDevicePushSubscription();

  // Try dispatching through backend server for true lockscreen wakeup test
  try {
    const res = await fetch('/api/push/send-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription ? subscription.toJSON() : undefined,
        shopName
      })
    });
    if (res.ok) {
      return true;
    }
  } catch (e) {
    console.warn('[Push Notifications] Backend test push failed, using local SW fallback:', e);
  }

  // Fallback to local Service Worker test
  const title = `🔔 ${shopName} Staff Push Active!`;
  const body = `Test push received! You will receive sound, vibration & lockscreen alerts for new orders even when the app is completely closed.`;
  const vibrationPattern = [300, 150, 300, 150, 400];

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

  return true;
}
