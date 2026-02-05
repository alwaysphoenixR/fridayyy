import express from "express";
const app = express();
import dotenv from "dotenv";
dotenv.config();
app.use(express.json());
const PORT = process.env.PORT || 8000;
app.get("/", (req, res) => {
  return res.send("this is the server");
});
app.listen(PORT, () => {
  console.log(`SERVER STARTED AT PORT NO ${PORT}`);
});
