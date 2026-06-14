import express from "express";
import {
  createShareableLink,
  getBrainLink,
} from "../controllers/linkControllers.js";
import { tokenValidate } from "../middlewares/authmiddlewares.js";
import { validate } from "../middlewares/validate.js";
import { ShareLinkSchema } from "../utils/types.js";
import rateLimit from "express-rate-limit";
const router = express.Router();
const brainLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 requests per 15 minutes per IP
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
router.post(
  "/brain/share",
  tokenValidate,
  validate(ShareLinkSchema),
  createShareableLink,
);
router.get("/brain/:brainLink", brainLinkLimiter, getBrainLink);
export default router;
