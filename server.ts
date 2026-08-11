import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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
