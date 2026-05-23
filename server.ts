import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Default NODE_ENV to development if not explicitly defined
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const isProd = process.env.NODE_ENV === "production";
  console.log(`\n==================================================`);
  console.log(`[StudySphere] Environment: ${process.env.NODE_ENV}`);
  console.log(`[StudySphere] Running Mode: ${isProd ? "PRODUCTION (Serving compiled dist/)" : "DEVELOPMENT (Active Vite HMR)"}`);
  console.log(`==================================================\n`);

  app.use(express.json());

  // Gemini API Proxy
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { prompt, history } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key not configured" });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are the StudySphere AI assistant. You help students learn skills, find mentors, and grow professionally in a futuristic student ecosystem.",
        }
      });

      const response = await chat.sendMessage({ message: prompt });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI response" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
