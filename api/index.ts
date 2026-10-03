import express from "express";
import webpush from "web-push";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "15mb" }));

// Web Push VAPID Setup
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BI2d_iUDhX_C1tQW8g24JUFhsmK-ZLkNPljOrjAIVn9p2q5w73jL0b1cbu1PbqfJvYW_kKoDLZkwUSO0Kk9rnb8";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "IJVK4TDPJMr49YlSt364653Kk3CzDeGyqy386MOTbXw";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@caidoz.cafe";

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.error("VAPID initialization error:", e);
}

// Health check
app.get(["/api/health", "/health"], (_req, res) => {
  res.json({ status: "ok" });
});

// Web Push Public Key route
app.get(["/api/push/public-key", "/push/public-key"], (_req, res) => {
  res.json({ success: true, publicKey: VAPID_PUBLIC_KEY });
});

// Register subscription
app.post(["/api/push/subscribe", "/push/subscribe"], (_req, res) => {
  res.json({ success: true });
});

// Unregister subscription
app.post(["/api/push/unsubscribe", "/push/unsubscribe"], (_req, res) => {
  res.json({ success: true });
});

// Send Push Alert for New Order
app.post(["/api/push/send-order-alert", "/push/send-order-alert"], async (req, res) => {
  try {
    const { order, shopName, subscriptions } = req.body || {};
    if (!order) {
      return res.status(400).json({ success: false, error: "Missing order details" });
    }

    const subsToUse = Array.isArray(subscriptions) ? subscriptions : [];
    if (subsToUse.length === 0) {
      return res.json({ success: true, sentCount: 0, message: "No active push subscriptions provided" });
    }

    const orderNum = order.id ? `#${order.id.slice(-4).toUpperCase()}` : '#NEW';
    const customer = order.customerName || 'Customer';
    const itemCount = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || order.items?.length || 1;
    const totalStr = `₱${(order.total || 0).toLocaleString()}`;
    const orderType = order.orderType === 'dine-in' ? 'Dine In' : 'Takeout';

    const payload = JSON.stringify({
      title: `🚨 NEW ORDER ${orderNum}!`,
      body: `${customer} • ${itemCount} item${itemCount > 1 ? 's' : ''} (${totalStr}) • ${orderType}\nTap to open Kitchen Queue.`,
      icon: '/icon-512.jpg',
      badge: '/icon-512.jpg',
      tag: `order-${order.id || Date.now()}`,
      data: {
        url: '/?view=cashier',
        view: 'cashier',
        orderId: order.id
      },
      vibrate: [300, 150, 300, 150, 400],
      actions: [
        { action: 'view', title: '👀 View Order' }
      ]
    });

    let sentCount = 0;
    await Promise.all(
      subsToUse.map(async (sub) => {
        try {
          const subObj = sub.endpoint ? sub : sub.subscription ? sub.subscription : sub;
          if (!subObj || !subObj.endpoint) return;
          await webpush.sendNotification(subObj, payload, {
            TTL: 86400,
            urgency: 'high',
            topic: 'caidoz-order'
          });
          sentCount++;
        } catch (pushErr: any) {
          console.warn(`[Web Push] Send failed:`, pushErr?.statusCode || pushErr?.message);
        }
      })
    );

    res.json({ success: true, sentCount, totalSubs: subsToUse.length });
  } catch (err: any) {
    console.error("[Web Push] Send order alert error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send Test Push Alert
app.post(["/api/push/send-test", "/push/send-test"], async (req, res) => {
  try {
    const { subscription, shopName } = req.body || {};
    if (!subscription) {
      return res.status(400).json({ success: false, error: "No subscription provided" });
    }

    const payload = JSON.stringify({
      title: `🔔 ${shopName || 'CAIDOZ'} Staff Push Active!`,
      body: `Test push received! You will receive sound, vibration & lockscreen alerts for new orders even when the app is completely closed.`,
      icon: '/icon-512.jpg',
      badge: '/icon-512.jpg',
      tag: `test-push-${Date.now()}`,
      data: {
        url: '/?view=settings',
        view: 'settings'
      },
      vibrate: [300, 150, 300, 150, 400],
      actions: [
        { action: 'view', title: '👀 View Order' }
      ]
    });

    const subObj = subscription.endpoint ? subscription : subscription.subscription ? subscription.subscription : subscription;
    if (!subObj || !subObj.endpoint) {
      return res.status(400).json({ success: false, error: "Invalid subscription format" });
    }

    await webpush.sendNotification(subObj, payload, {
      TTL: 86400,
      urgency: 'high',
      topic: 'caidoz-test'
    });

    res.json({ success: true, sentCount: 1 });
  } catch (err: any) {
    console.error("[Web Push] Send test error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default app;
