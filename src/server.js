import express from "express";
import dotenv from "dotenv";
import { dbConnect } from "./db/connect.js";
import authRoutes from "./routes/authRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import linkRoutes from "./routes/linkRoutes.js";
import searchRoutes from "./routes/search.routes.js";
import { initializeQdrant } from "./db/qdrant.js";

dotenv.config();

const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.get("/", (req, res) => {
  return res.send("this is the server");
});

app.use("/v1", authRoutes);
app.use("/v1", contentRoutes);
app.use("/v1", linkRoutes);
app.use("/v1", searchRoutes);

// db connect
dbConnect();
initializeQdrant();
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`SERVER STARTED AT PORT NO ${PORT}`);
});
