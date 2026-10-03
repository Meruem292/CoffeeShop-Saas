import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BI2d_iUDhX_C1tQW8g24JUFhsmK-ZLkNPljOrjAIVn9p2q5w73jL0b1cbu1PbqfJvYW_kKoDLZkwUSO0Kk9rnb8";

export default function handler(_req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (_req.method === "OPTIONS") {
    return res.status(200).end();
  }

  return res.status(200).json({
    success: true,
    publicKey: VAPID_PUBLIC_KEY
  });
}
