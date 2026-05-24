import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
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
