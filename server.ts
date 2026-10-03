import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import webpush from "web-push";

dotenv.config();

// Web Push VAPID Setup
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BBqdrlsWSnMBakioIX3sQnPgTJw6fuifZDcvxJ9rfiSff7UN5ox4W3vDsmtGQ1N976taLUMcMyt3NQRPxthPoGA";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "UACOMhXqW0w-5gEtJsDUraDXToU5Tb7hEeQ4d1ehDOw";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@caidoz.cafe";

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.error("Failed to initialize VAPID:", e);
}

// Persistent Push Subscriptions Store
const SUBS_FILE = path.join(process.cwd(), "push_subscriptions.json");

interface PushSubRecord {
  endpoint: string;
  subscription: webpush.PushSubscription;
  userId?: string;
  role?: string;
  userAgent?: string;
  createdAt: number;
}

function loadSubscriptions(): PushSubRecord[] {
  try {
    if (fs.existsSync(SUBS_FILE)) {
      const data = fs.readFileSync(SUBS_FILE, "utf-8");
      return JSON.parse(data) || [];
    }
  } catch (err) {
    console.error("Error reading subscriptions file:", err);
  }
  return [];
}

function saveSubscriptions(subs: PushSubRecord[]) {
  try {
    fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving subscriptions file:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // Helper to initialize Gemini SDK safely
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({ apiKey });
  };

  // Health check route
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Web Push Public Key route
  app.get("/api/push/public-key", (_req, res) => {
    res.json({ success: true, publicKey: VAPID_PUBLIC_KEY });
  });

  // Register device push subscription
  app.post("/api/push/subscribe", (req, res) => {
    try {
      const { subscription, userId, role } = req.body;
      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ success: false, error: "Invalid subscription payload" });
      }

      const subs = loadSubscriptions();
      const existingIdx = subs.findIndex(s => s.endpoint === subscription.endpoint);
      const newRecord: PushSubRecord = {
        endpoint: subscription.endpoint,
        subscription,
        userId: userId || undefined,
        role: role || 'admin',
        userAgent: req.headers['user-agent'],
        createdAt: Date.now()
      };

      if (existingIdx >= 0) {
        subs[existingIdx] = newRecord;
      } else {
        subs.push(newRecord);
      }

      saveSubscriptions(subs);
      console.log(`[Web Push] Registered subscription (${subs.length} active device${subs.length > 1 ? 's' : ''})`);
      res.json({ success: true, count: subs.length });
    } catch (err: any) {
      console.error("[Web Push] Subscribe error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Unregister device push subscription
  app.post("/api/push/unsubscribe", (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ success: false, error: "Missing endpoint" });
      }

      let subs = loadSubscriptions();
      subs = subs.filter(s => s.endpoint !== endpoint);
      saveSubscriptions(subs);
      console.log(`[Web Push] Unregistered subscription (${subs.length} remaining)`);
      res.json({ success: true, count: subs.length });
    } catch (err: any) {
      console.error("[Web Push] Unsubscribe error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Send Push Alert for New Order to all registered staff devices
  app.post("/api/push/send-order-alert", async (req, res) => {
    try {
      const { order, shopName, subscriptions: passedSubs } = req.body;
      if (!order) {
        return res.status(400).json({ success: false, error: "Missing order details" });
      }

      // Use subscriptions passed from Firestore or fallback to locally stored records
      const localSubs = loadSubscriptions();
      const subsToUse: any[] = (Array.isArray(passedSubs) && passedSubs.length > 0)
        ? passedSubs.map(s => (s.endpoint ? s : s.subscription ? s.subscription : s))
        : localSubs.map(s => s.subscription);

      if (subsToUse.length === 0) {
        return res.json({ success: true, sentCount: 0, message: "No active push subscriptions registered" });
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
      const deadEndpoints: string[] = [];

      await Promise.all(
        subsToUse.map(async (sub) => {
          try {
            // High Urgency header is critical to wake up Android Doze mode and lock screens
            await webpush.sendNotification(sub, payload, {
              TTL: 86400,
              urgency: 'high',
              topic: 'caidoz-order'
            });
            sentCount++;
          } catch (pushErr: any) {
            console.warn(`[Web Push] Send failed for endpoint:`, pushErr.statusCode);
            if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
              if (sub.endpoint) deadEndpoints.push(sub.endpoint);
            }
          }
        })
      );

      // Clean up expired / unregistered device tokens from local storage
      if (deadEndpoints.length > 0) {
        const cleanedSubs = localSubs.filter(s => !deadEndpoints.includes(s.endpoint));
        saveSubscriptions(cleanedSubs);
      }

      console.log(`[Web Push] Dispatched high-urgency order alert to ${sentCount}/${subsToUse.length} device(s)`);
      res.json({ success: true, sentCount, totalSubs: subsToUse.length });
    } catch (err: any) {
      console.error("[Web Push] Order alert dispatch error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Send Test Push Alert to verify phone / tablet lockscreen wakeup
  app.post("/api/push/send-test", async (req, res) => {
    try {
      const { subscription, shopName } = req.body;
      const localSubs = loadSubscriptions();
      const targetSubs = subscription ? [subscription] : localSubs.map(s => s.subscription);

      if (targetSubs.length === 0) {
        return res.status(400).json({ success: false, error: "No push subscription available to test. Please enable push notifications on this device first." });
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

      let sentCount = 0;
      await Promise.all(
        targetSubs.map(async (s: any) => {
          try {
            await webpush.sendNotification(s, payload, {
              TTL: 86400,
              urgency: 'high',
              topic: 'caidoz-test'
            });
            sentCount++;
          } catch (err: any) {
            console.warn("[Web Push] Test push delivery failed:", err.message);
          }
        })
      );

      res.json({ success: true, sentCount });
    } catch (err: any) {
      console.error("[Web Push] Test push error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // AI Face Matching route for Kiosk auto identification
  app.post("/api/gemini/face-match", async (req, res) => {
    try {
      const { imageBase64, candidates } = req.body;
      if (!imageBase64 || !candidates || !Array.isArray(candidates) || candidates.length === 0) {
        return res.json({ success: false, matchedUid: null, message: "No registered candidate face photos found" });
      }

      // Filter candidates with valid photo URLs or base64 face data
      const validCandidates = candidates.filter((c: any) => c.photoURL && typeof c.photoURL === 'string' && c.photoURL.length > 50);
      if (validCandidates.length === 0) {
        return res.json({ success: false, matchedUid: null, message: "No registered face photos found among customer accounts" });
      }

      const cleanTargetBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      // Initialize Gemini AI client safely
      const ai = getGeminiClient();
      if (!ai) {
        return res.json({
          success: false,
          matchedUid: null,
          message: "Client-side Google MediaPipe Face Mesh is active for in-browser face matching."
        });
      }

      // Prepare text and images for Gemini 2.5 Flash
      const parts: any[] = [
        {
          text: `You are an AI Face Recognition System for a coffee shop kiosk. 
Analyze the live target face scan and compare it against the provided candidate customer profile photos below.
Candidate profiles list:
${validCandidates.map((c: any, i: number) => `Candidate #${i+1}: Name="${c.displayName || 'Customer'}", UID="${c.uid}", ShortID="${c.shortId || ''}"`).join('\n')}

Determine if the target face image matches any candidate profile photo.
Return JSON with:
- "matchedUid": string (the exact UID of the matched user, or empty string "" if no match)
- "matchedShortId": string (the shortId of the matched user, or empty string "")
- "confidence": number (confidence score from 0.0 to 1.0)
- "greetingName": string (display name or first name of the matched customer, or empty string)`
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanTargetBase64
          }
        }
      ];

      // Append up to 10 candidate face photos
      validCandidates.slice(0, 10).forEach((c: any, i: number) => {
        const cleanCandidateBase64 = c.photoURL.replace(/^data:image\/\w+;base64,/, "");
        if (cleanCandidateBase64.length > 20) {
          parts.push({
            text: `Registered Photo for Candidate #${i+1} (UID: ${c.uid}):`
          });
          parts.push({
            inlineData: {
              mimeType: c.photoURL.startsWith('data:image/png') ? "image/png" : "image/jpeg",
              data: cleanCandidateBase64
            }
          });
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchedUid: { type: Type.STRING, description: "Matched user UID or empty string" },
              matchedShortId: { type: Type.STRING, description: "Matched user shortId or empty string" },
              confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1" },
              greetingName: { type: Type.STRING, description: "Customer name" }
            },
            required: ["matchedUid", "confidence"]
          }
        }
      });

      const resultText = response.text || "{}";
      const parsed = JSON.parse(resultText);

      if (parsed.matchedUid && parsed.matchedUid !== "" && parsed.confidence >= 0.55) {
        return res.json({
          success: true,
          matchedUid: parsed.matchedUid,
          matchedShortId: parsed.matchedShortId || "",
          greetingName: parsed.greetingName || "",
          confidence: parsed.confidence
        });
      } else {
        return res.json({
          success: false,
          matchedUid: null,
          message: "Face not recognized. Please register Face ID in your account or scan your member QR."
        });
      }
    } catch (error: any) {
      console.error("Gemini Face Match error:", error);
      res.json({ success: false, matchedUid: null, message: "AI Face scan service encountered an error or key limitation. Please use Member QR or 5-char Account ID." });
    }
  });

  // Vite middleware for development vs static production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
