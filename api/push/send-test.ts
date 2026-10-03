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
    const { subscription, shopName } = req.body || {};
    if (!subscription) {
      return res.status(400).json({ success: false, error: "No subscription provided" });
    }

    const payload = JSON.stringify({
      title: `🔔 ${shopName || "CAIDOZ"} Staff Push Active!`,
      body: `Test push received! You will receive sound, vibration & lockscreen alerts for new orders even when the app is completely closed.`,
      icon: "/icon-512.jpg",
      badge: "/icon-512.jpg",
      tag: `test-push-${Date.now()}`,
      data: {
        url: "/?view=settings",
        view: "settings"
      },
      vibrate: [300, 150, 300, 150, 400],
      actions: [
        { action: "view", title: "👀 View Order" }
      ]
    });

    const subObj = subscription.endpoint ? subscription : subscription.subscription ? subscription.subscription : subscription;
    if (!subObj || !subObj.endpoint) {
      return res.status(400).json({ success: false, error: "Invalid subscription format" });
    }

    await webpush.sendNotification(subObj, payload, {
      TTL: 86400,
      urgency: "high",
      topic: "caidoz-test"
    });

    return res.status(200).json({ success: true, sentCount: 1 });
  } catch (err: any) {
    console.error("[Web Push] Send test error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
