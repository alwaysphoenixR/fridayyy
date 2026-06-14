import { UserModel } from "../db/models/User.js"; // Fixed: PascalCase
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Consistent cookie options — defined once, used in login, signup, logout, refresh.
// secure: only send over HTTPS in production. In dev, allows HTTP (localhost).
// sameSite: "Strict" prevents CSRF — cookie is not sent on cross-site requests.
// httpOnly: JS cannot read this cookie — blocks XSS token theft.
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Strict",
};

// Generates both tokens and persists a HASHED refresh token to DB.
// Accepts the full user document — avoids an extra findById round trip.
// Moved out of individual controllers so it's reusable (OAuth, SSO, etc.)
const generateAndSaveTokens = async (user) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Store a bcrypt hash of the refresh token — not the raw token.
  // Raw token = credential. If DB is breached, hashed tokens cannot be replayed.
  // Cost factor 10 is intentional — refresh happens rarely so CPU cost is acceptable.
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  // Use findByIdAndUpdate instead of user.save() —
  // more targeted, skips pre-save hooks (password re-hash, etc.)
  await UserModel.findByIdAndUpdate(user._id, {
    $set: { refreshToken: hashedRefreshToken },
  });

  return { accessToken, refreshToken }; // Return RAW token to send to client
};

export const signup = async (req, res) => {
  try {
    // Validation is now handled by validate(CreateUserSchema) middleware at route level.
    // req.body is already validated, trimmed, and lowercased before reaching here.
    const { username, password } = req.body;

    // Check for existing user — DB unique index also catches this,
    // but checking first gives us a controlled 409 instead of a raw MongoError.
    // Race condition: two simultaneous signups with same username —
    // one will hit the unique index and throw. Caught below and returned as 409.
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "Username already taken" });
    }

    // Password is hashed automatically by the pre-save hook in User model.
    // Do not hash here — the hook handles it.
    const newUser = await UserModel.create({ username, password });

    // Pass newUser directly — avoids a second findById inside generateAndSaveTokens.
    const { accessToken, refreshToken } = await generateAndSaveTokens(newUser);

    return res
      .status(201)
      .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
      .json({
        message: "Account created successfully",
        accessToken,
        user: { username: newUser.username, id: newUser._id },
      });
  } catch (err) {
    // Handle duplicate key error from MongoDB unique index (race condition on username).
    if (err.code === 11000) {
      return res.status(409).json({ message: "Username already taken" });
    }
    console.error("[signup] Error:", err); // Log for observability — never logged before
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    // req.body already validated by validate(SigninSchema) middleware.
    const { username, password } = req.body;

    const user = await UserModel.findOne({ username });

    // Unified error message — never reveal whether username or password was wrong.
    // Prevents user enumeration attacks (attacker can't tell if username exists).
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = await generateAndSaveTokens(user);

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
      .json({
        message: "Logged in successfully",
        accessToken, // Frontend stores in memory/state — NOT localStorage
        user: { username: user.username, id: user._id },
      });
  } catch (err) {
    console.error("[login] Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    // req.user is set by tokenValidate middleware.
    // Clear refresh token from DB — invalidates all future refresh attempts.
    // $unset removes the field entirely. $set: { refreshToken: undefined } does NOTHING in MongoDB.
    await UserModel.findByIdAndUpdate(req.user._id, {
      $unset: { refreshToken: 1 },
    });

    // Clear the httpOnly cookie from the browser.
    // Must pass the same options used when setting — otherwise clearCookie silently fails.
    return res
      .status(200)
      .clearCookie("refreshToken", COOKIE_OPTIONS)
      .json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("[logout] Error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error during logout" });
  }
};

export const refreshAccessToken = async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ message: "No refresh token found" });
  }

  try {
    // Verify signature and expiry — throws on tampered or expired token.
    // jwt.verify never returns null, so no optional chaining needed on the result.
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await UserModel.findById(decodedToken._id);
    if (!user || !user.refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Compare incoming token against the HASHED token stored in DB.
    // bcrypt.compare is timing-safe — prevents timing attacks on token comparison.
    // Plain string comparison (===) is NOT timing-safe and should never be used for credentials.
    const isTokenValid = await bcrypt.compare(
      incomingRefreshToken,
      user.refreshToken,
    );

    if (!isTokenValid) {
      // Token doesn't match DB — possible token theft or reuse after rotation.
      // Security: consider invalidating ALL sessions here (clear refreshToken entirely)
      // to protect the user in case their token was stolen.
      console.warn("[refreshAccessToken] Token mismatch for user:", user._id);
      return res
        .status(401)
        .json({ message: "Refresh token is invalid or already used" });
    }

    // Refresh Token Rotation — generate new tokens on every refresh.
    // Old refresh token is replaced in DB — replayed tokens will fail the bcrypt check above.
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAndSaveTokens(user);

    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS)
      .json({
        message: "Access token refreshed",
        accessToken,
      });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Refresh token has expired, please log in again" });
    }
    console.error("[refreshAccessToken] Error:", error);
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};
