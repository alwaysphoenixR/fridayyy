import express from "express";
import dotenv from "dotenv";
import { dbConnect } from "./db/connect.js";
import authRoutes from "./routes/authRoutes.js";

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

// db connect
dbConnect();

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`SERVER STARTED AT PORT NO ${PORT}`);
});
