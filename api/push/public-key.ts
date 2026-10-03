import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BBqdrlsWSnMBakioIX3sQnPgTJw6fuifZDcvxJ9rfiSff7UN5ox4W3vDsmtGQ1N976taLUMcMyt3NQRPxthPoGA";

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
