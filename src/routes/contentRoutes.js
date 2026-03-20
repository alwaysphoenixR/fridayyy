import express from "express";
import {
  createContent,
  deleteContent,
  getContent,
} from "../controllers/contentControllers.js";
import { tokenValidate } from "../middlewares/authmiddlewares.js";
const router = express.Router();

router.post("/content", tokenValidate, createContent);
router.get("/content", tokenValidate, getContent);
router.delete("/content", tokenValidate, deleteContent);
export default router;
