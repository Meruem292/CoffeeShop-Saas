import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BBqdrlsWSnMBakioIX3sQnPgTJw6fuifZDcvxJ9rfiSff7UN5ox4W3vDsmtGQ1N976taLUMcMyt3NQRPxthPoGA";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "UACOMhXqW0w-5gEtJsDUraDXToU5Tb7hEeQ4d1ehDOw";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@caidoz.cafe";

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.error("VAPID initialization error:", e);
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { order, shopName, subscriptions } = req.body || {};
    if (!order) {
      return res.status(400).json({ success: false, error: "Missing order details" });
    }

    const subsToUse = Array.isArray(subscriptions) ? subscriptions : [];
    if (subsToUse.length === 0) {
      return res.json({ success: true, sentCount: 0, message: "No active push subscriptions provided" });
    }

    const orderNum = order.id ? `#${order.id.slice(-4).toUpperCase()}` : "#NEW";
    const customer = order.customerName || "Customer";
    const itemCount = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || order.items?.length || 1;
    const totalStr = `₱${(order.total || 0).toLocaleString()}`;
    const orderType = order.orderType === "dine-in" ? "Dine In" : "Takeout";

    const payload = JSON.stringify({
      title: `🚨 NEW ORDER ${orderNum}!`,
      body: `${customer} • ${itemCount} item${itemCount > 1 ? "s" : ""} (${totalStr}) • ${orderType}\nTap to open Kitchen Queue.`,
      icon: "/icon-512.jpg",
      badge: "/icon-512.jpg",
      tag: `order-${order.id || Date.now()}`,
      data: {
        url: "/?view=cashier",
        view: "cashier",
        orderId: order.id
      },
      vibrate: [300, 150, 300, 150, 400],
      actions: [
        { action: "view", title: "👀 View Order" }
      ]
    });

    let sentCount = 0;
    await Promise.all(
      subsToUse.map(async (sub: any) => {
        try {
          const subObj = sub.endpoint ? sub : sub.subscription ? sub.subscription : sub;
          if (!subObj || !subObj.endpoint) return;
          await webpush.sendNotification(subObj, payload, {
            TTL: 86400,
            urgency: "high",
            topic: "caidoz-order"
          });
          sentCount++;
        } catch (pushErr: any) {
          console.warn("[Web Push] Send failed:", pushErr?.statusCode || pushErr?.message);
        }
      })
    );

    return res.status(200).json({ success: true, sentCount, totalSubs: subsToUse.length });
  } catch (err: any) {
    console.error("[Web Push] Send order alert error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
