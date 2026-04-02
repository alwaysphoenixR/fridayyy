import express from "express";
import {
  createShareableLink,
  getBrainlink,
} from "../controllers/linkControllers.js";
import { tokenValidate } from "../middlewares/authmiddlewares.js";
const router = express.Router();
router.post("/brain/share", tokenValidate, createShareableLink);
router.get("/brain/:brainLink", getBrainlink);
export default router;
