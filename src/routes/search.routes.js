// In search router
import express from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../middlewares/validate.js";
import { SearchSchema } from "../utils/types.js";
import { searchBrain } from "../controllers/search.controller.js";
import { tokenValidate } from "../middlewares/authmiddlewares.js";
// import router from "./contentRoutes.js";
const router = express.Router();

// Strict rate limit — each search triggers 6 external API calls.
// Without this, one user can exhaust your entire Groq + embedding quota.
const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 searches per minute per IP
  message: { message: "Too many search requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/search",
  tokenValidate,
  searchRateLimiter,
  validate(SearchSchema),
  searchBrain,
);
export default router;
