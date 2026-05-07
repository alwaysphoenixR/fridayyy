// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// const JWT_SECRET = process.env.JWT_SECRET;
// export const tokenValidate = async (req, res, next) => {
//   try {
//     const token = req?.headers["authorization"].split(" ")[1];

//     console.log("Actual token:", token);
//     const decoded = await jwt.verify(token, JWT_SECRET);
//     console.log(decoded);

//     if (!decoded || !decoded.userId) {
//       return res.status(403).json({
//         message: "UNAUTHORIZED",
//       });
//     }
//     // console.log("yo");
//     req.userId = decoded.userId;
//     return next();
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({
//       message: "INTERNAL SERVER ERROR",
//     });
//   }
// };

import jwt from "jsonwebtoken";
import { userModel } from "../db/models/User.js";

export const tokenValidate = async (req, res, next) => {
  try {
    // 1. Extract token and handle missing header safely
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // 2. Verify token using the ACCESS_TOKEN_SECRET
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 3. Fetch user from DB to ensure they still exist and token hasn't been revoked
    // We search by the ID stored in the token payload
    const user = await userModel
      .findById(decodedToken?._id)
      .select("-password");

    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid Access Token or User not found" });
    }

    // 4. Attach the full user object to the request
    // This allows routes like /logout to access req.user._id
    req.user = user;
    next();
  } catch (error) {
    // 5. Specific Error Handling for the Frontend
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token Expired",
        expired: true,
      });
    }

    return res.status(401).json({
      message: error?.message || "Invalid Access Token",
    });
  }
};
