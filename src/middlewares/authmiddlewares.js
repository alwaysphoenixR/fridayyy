import jwt from "jsonwebtoken";
import { UserModel } from "../db/models/User.js";

export const tokenValidate = async (req, res, next) => {
  try {
    // 1. Extract Bearer token from Authorization header.
    // Express normalizes header names to lowercase, so "authorization" is correct.
    // Format expected: "Bearer <token>"
    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // 2. Cryptographically verify the token.
    // jwt.verify() throws on: expired token, invalid signature, malformed token.
    // It NEVER returns null — either returns payload or throws. No optional chaining needed.
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 3. Fetch user from DB to confirm they still exist.
    // This intentionally adds a DB call per request — it's a tradeoff:
    // PRO: Catches deleted users, future banned/suspended users immediately.
    // CON: Extra DB hit on every authenticated request.
    // Alternative: trust the JWT (no DB call) — faster but tokens can't be revoked until expiry.
    // At current scale, the DB lookup is acceptable. Add Redis caching if this becomes a bottleneck.
    const user = await UserModel.findById(decodedToken._id)
      // Strip ALL credential fields — not just password.
      // refreshToken is a session credential. tokenVersion is an internal counter.
      // If any controller does res.json(req.user), none of these will leak.
      .select("-password -refreshToken -tokenVersion");

    if (!user) {
      // Token is valid but user no longer exists — deleted account with live token.
      return res.status(401).json({ message: "User not found" });
    }

    // Future extension point: add account status checks here.
    // Example: if (!user.isActive) return res.status(403).json({ message: "Account suspended" });

    // 4. Attach sanitized user to request for downstream handlers.
    // Controllers and services should use req.user._id for ownership checks.
    // req.user is already stripped of credentials by .select() above.
    req.user = user;
    next();
  } catch (error) {
    // 5. Distinguish token errors from infrastructure errors.
    // Never leak raw infrastructure errors (DB connection strings, internal paths) to clients.

    if (error.name === "TokenExpiredError") {
      // Tell the frontend explicitly so it can attempt a token refresh
      // instead of redirecting to login unnecessarily.
      return res.status(401).json({
        message: "Token expired",
        expired: true,
      });
    }

    if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
      // Malformed token, invalid signature, or token used before nbf claim.
      return res.status(401).json({ message: "Invalid token" });
    }

    // Anything else (DB down, unexpected error) — log it server-side, return generic message.
    // NEVER send error.message to the client here — it may contain infrastructure details.
    console.error("[tokenValidate] Unexpected error during auth:", error);
    return res
      .status(500)
      .json({ message: "Authentication service unavailable" });
  }
};
