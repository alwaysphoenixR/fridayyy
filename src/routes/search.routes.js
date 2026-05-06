import express from "express";
import { searchBrain } from "../controllers/search.controller.js";
import { tokenValidate } from "../middlewares/authmiddlewares.js";
// import your auth middleware here!

const router = express.Router();

router.post("/query", tokenValidate, searchBrain);

export default router;
