import express from "express";
import { signup, login } from "../controllers/authControllers.js";
// const router = express.Router();
const router = express.Router();

router.post("/signup", signup);
router.get("/login", login);
export default router;
