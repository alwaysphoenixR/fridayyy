import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import { dbConnect } from "./db/connect.js";
import { initializeQdrant } from "./db/qdrant.js";

import authRoutes from "./routes/authRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import linkRoutes from "./routes/linkRoutes.js";
import searchRoutes from "./routes/search.routes.js";
import { ContentModel } from "./db/models/Content.js";

// Load env vars first — everything below depends on them
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// --- SECURITY MIDDLEWARE ---

// Sets secure HTTP headers: X-Content-Type-Options, X-Frame-Options,
// Strict-Transport-Security, etc. One line, significant attack surface reduction.
app.use(helmet());

// CORS — must be configured before routes.
// In production, replace with your actual frontend domain.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true, // Required for cookies (refresh token) to be sent cross-origin
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  }),
);

// --- BODY PARSING ---
app.use(express.json({ limit: "1mb" })); // Cap JSON body size — prevent large payload DoS
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// --- BASELINE RATE LIMIT ---
// Applies to all routes as a floor. Individual routes (auth, search) have stricter limits.
// Prevents basic DoS on any endpoint that doesn't have its own limiter.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per IP per 15 minutes across all routes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// --- HEALTH CHECK ---
// Simple liveness probe — useful for Docker, Kubernetes, load balancers.
// Returns 200 if the process is running. Doesn't check DB/Qdrant (that's a readiness probe).
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// --- ROUTES ---
// All routes scoped under /api/v1 — 'api' distinguishes from static files or frontend routes.
// 'v1' enables non-breaking API evolution — /api/v2 can coexist with /api/v1.
app.use("/api/v1/auth", authRoutes); // POST /api/v1/auth/login
app.use("/api/v1/content", contentRoutes); // GET  /api/v1/content
app.use("/api/v1/share", linkRoutes); // POST /api/v1/share
app.use("/api/v1/search", searchRoutes); // POST /api/v1/search

// --- GLOBAL ERROR HANDLER ---
// 4-argument signature is how Express identifies error handlers.
// Catches any error passed via next(err) from routes or middleware.
// Without this, unhandled errors either crash the process or hang requests.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  // Never leak stack traces or internal error details to clients in production.
  const message =
    process.env.NODE_ENV === "production"
      ? status < 500
        ? err.message
        : "Internal server error"
      : err.message;

  console.error(`[ERROR] ${req.method} ${req.path} → ${status}:`, err.message);

  return res.status(status).json({ message });
});

// --- STARTUP SEQUENCE ---
// Order matters:
// 1. Connect MongoDB — models need this before any request is served
// 2. Initialize Qdrant — collection must exist before ingestion or search
// 3. Start listening — only after both DBs are ready

const startServer = async () => {
  try {
    // MongoDB connection — await it, don't fire and forget
    await dbConnect();
    console.info("[startup] MongoDB connected");

    // Qdrant initialization — creates collection + indexes if they don't exist.
    // Throws if Qdrant is unreachable — caught below → process.exit(1)
    await initializeQdrant();
    console.info("[startup] Qdrant initialized");

    app.listen(PORT, () => {
      console.info(`[startup] Server running on port ${PORT}`);
    });
    // const indexes = await ContentModel.collection.indexes();
    // console.log(indexes);
    // const nullLinks = await ContentModel.find({
    //   link: null,
    // }).lean();

    // console.log(nullLinks);
  } catch (error) {
    // A database failure at startup means the app cannot serve any real requests.
    // Crash loudly — let your process manager (PM2, Docker, Kubernetes) restart.
    // A silent boot with broken DBs is harder to detect and debug than a clear exit.
    console.error("[startup] FATAL — server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();
