import express from "express";
import rateLimit from "express-rate-limit";
import {
  signup,
  login,
  logout,
  refreshAccessToken,
} from "../controllers/authControllers.js";
import { tokenValidate } from "../middlewares/authmiddlewares.js";
import { validate } from "../middlewares/validate.js"; // Zod validation middleware
import { CreateUserSchema, SigninSchema } from "../utils/types.js";

const router = express.Router();

// --- RATE LIMITERS ---
// Auth endpoints are the highest-value brute-force target in the app.
// These limits are per-IP and reset after the window.
// Tune based on your expected legitimate traffic patterns.

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per IP per 15 minutes
  // After 10 failures in 15 minutes, return 429.
  // Legitimate users won't hit this; brute-forcers will.
  message: {
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true, // Return RateLimit-* headers so clients know their limit
  legacyHeaders: false,
});

const signupRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 accounts per IP per hour — prevents spam account creation
  message: {
    message: "Too many accounts created from this IP. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Refresh tokens rotate frequently — allow more headroom
  message: { message: "Too many refresh attempts. Please log in again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- PUBLIC ROUTES ---
// No access token required. Rate limited and input-validated.

// validate() is a middleware factory that runs Zod schema validation
// before the controller. If validation fails, it returns 400 before
// the controller is ever called. Controllers should never receive invalid input.
router.post("/signup", signupRateLimiter, validate(CreateUserSchema), signup);
router.post("/login", loginRateLimiter, validate(SigninSchema), login);

// Refresh token endpoint — accepts a refresh token in the request body,
// returns a new access token. Rate limited because it's a sensitive credential endpoint.
// Does not require tokenValidate — the controller validates the refresh token itself.
router.post("/refresh-token", refreshRateLimiter, refreshAccessToken);

// --- PROTECTED ROUTES ---

// KNOWN LIMITATION: If the access token is expired, logout returns 401.
// The frontend must call /refresh-token first to get a fresh access token,
// then call /logout — OR the logout controller should accept the refresh token
// directly and invalidate it without needing a valid access token.
// This is a UX tradeoff — document it and handle it in the frontend flow.
router.post("/logout", tokenValidate, logout);

export default router;
