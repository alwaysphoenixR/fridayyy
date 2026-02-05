import express from "express";
import dotenv from "dotenv";
import { dbConnect } from "./db/connect.js";
const app = express();

dotenv.config();
app.use(express.json());
const PORT = process.env.PORT || 8000;
app.get("/", (req, res) => {
  return res.send("this is the server");
});
app.listen(PORT, () => {
  console.log(`SERVER STARTED AT PORT NO ${PORT}`);
});
dbConnect();
