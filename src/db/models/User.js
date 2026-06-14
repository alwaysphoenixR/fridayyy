import mongoose, { Schema } from "mongoose"; // Fixed: single import statement
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Guard critical secrets at module load time.
// If these are undefined, fail loudly at startup — not silently during a user's login.
// A missing secret would sign tokens with "undefined" as the key — a critical security hole.
const {
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRY,
} = process.env;

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error(
    "FATAL: ACCESS_TOKEN_SECRET or REFRESH_TOKEN_SECRET is not defined. Check your .env file.",
  );
}

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      // maxlength is intentionally omitted here — bcrypt truncates at 72 bytes anyway.
      // Enforcing maxlength at the controller/validation layer is cleaner.
    },

    // Store a HASH of the refresh token, not the raw token.
    // The raw token is a credential. If your DB is breached, hashed tokens
    // cannot be directly replayed — attacker still needs to brute-force bcrypt.
    refreshToken: {
      type: String,
      default: null,
    },

    // Token version for invalidating all sessions on password change or logout-all.
    // Increment this whenever you want to invalidate all existing refresh tokens.
    // Include this in the refresh token payload and validate on each refresh.
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,

    toJSON: {
      transform(doc, ret) {
        // CRITICAL: Never serialize password or refreshToken to API responses.
        // These are internal credentials — one is a bcrypt hash, one is a session token.
        delete ret.password;
        delete ret.refreshToken;
        delete ret.tokenVersion; // Clients don't need this — it's an internal counter
        delete ret.__v;
        return ret;
      },
    },
  },
);

// --- INDEXES ---

// Index for refresh token lookup — your auth middleware will query by this field.
// Without an index, every token refresh is a full User collection scan.
userSchema.index({ refreshToken: 1 });

// --- HOOKS ---

// Hash password before any save where password was modified.
// isModified() ensures we don't re-hash an already-hashed password
// when updating unrelated fields like username or tokenVersion.
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err); // Propagate bcrypt errors to the calling controller's try/catch
  }
});

// --- INSTANCE METHODS ---

// Compare a plain-text candidate password against the stored bcrypt hash.
// bcrypt.compare is timing-safe — it prevents timing attacks.
// Returns a boolean — let the controller decide what error to throw.
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Short-lived access token — stateless, not stored in DB.
// Payload is minimal: only _id. Don't put mutable data (username, roles)
// in the payload — it goes stale. Fetch fresh from DB if needed.
userSchema.methods.generateAccessToken = function () {
  if (!ACCESS_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET is not configured");
  }
  return jwt.sign(
    { _id: this._id },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY || "15m" }, // Fallback prevents non-expiring tokens
  );
};

// Long-lived refresh token — stored (hashed) in DB, used to rotate access tokens.
// Include tokenVersion so you can invalidate all sessions by incrementing it.
// On password change: increment tokenVersion → all old refresh tokens become invalid.
userSchema.methods.generateRefreshToken = function () {
  if (!REFRESH_TOKEN_SECRET) {
    throw new Error("REFRESH_TOKEN_SECRET is not configured");
  }
  return jwt.sign(
    {
      _id: this._id,
      tokenVersion: this.tokenVersion, // Enables session invalidation without a token blacklist
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY || "7d" },
  );
};

export const UserModel = mongoose.model("User", userSchema);
