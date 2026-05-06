import jwt from "jsonwebtoken";
import dotenv from "dotenv";
const JWT_SECRET = process.env.JWT_SECRET;
export const tokenValidate = async (req, res, next) => {
  try {
    const token = req?.headers["authorization"].split(" ")[1];

    console.log("Actual token:", token);
    const decoded = await jwt.verify(token, JWT_SECRET);
    console.log(decoded);

    if (!decoded || !decoded.userId) {
      return res.status(403).json({
        message: "UNAUTHORIZED",
      });
    }
    // console.log("yo");
    req.userId = decoded.userId;
    return next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};
