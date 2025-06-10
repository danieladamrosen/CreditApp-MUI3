import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// CRITICAL: Immediate health check response for deployment platforms
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", service: "active", timestamp: Date.now() });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "Credit Repair Dashboard",
    timestamp: new Date().toISOString(),
  });
});

app.head("/health", (_req, res) => res.status(200).end());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API running",
    timestamp: new Date().toISOString(),
  });
});

// Optimized middleware setup
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  log(`Error: ${message}`);
});

// Get port from environment variable with fallback
const port = parseInt(process.env.PORT as string, 10) || 5000;

async function initializeServer() {
  // Register routes synchronously BEFORE starting server
  try {
    registerRoutes(app);
    log("API routes registered successfully");
  } catch (routeError) {
    log(`Warning: Failed to register some routes: ${routeError}`);
  }

  // Setup environment-specific features
  if (process.env.NODE_ENV === "development") {
    try {
      await setupVite(app);
      log("Vite setup completed");
    } catch (viteError) {
      log(`Warning: Vite setup failed: ${viteError}`);
    }
  } else {
    serveStatic(app);
    log("Static file serving enabled");
  }

  // Start server AFTER all routes are registered
  return app.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
}

initializeServer().then(serverInstance => {
  serverInstance.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      log(`Port ${port} is already in use`);
    } else {
      log(`Server error: ${err.message}`);
    }
    process.exit(1);
  });

  process.on("SIGTERM", () => {
    log("SIGTERM received, shutting down gracefully");
    serverInstance.close(() => {
      log("Process terminated");
      process.exit(0);
    });
  });
}).catch(error => {
  log(`Failed to initialize server: ${error.message}`);
  process.exit(1);
});