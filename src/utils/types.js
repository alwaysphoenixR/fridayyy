import z from "zod";

// Centralized limits — referenced in both schemas and should match your User model.
// If you change these, change them in ONE place.
// IMPORTANT: Keep in sync with minlength/maxlength in userSchema (User model).
const USERNAME_MIN = 3;
const USERNAME_MAX = 30; // Match User model maxlength
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 100; // bcrypt silently truncates at 72 bytes; cap well before that

export const CreateUserSchema = z.object({
  username: z
    .string()
    .trim() // Trim before validation — "  bob  " should not create a user named "  bob  "
    .min(USERNAME_MIN, {
      message: `Username must be at least ${USERNAME_MIN} characters`,
    })
    .max(USERNAME_MAX, {
      message: `Username cannot exceed ${USERNAME_MAX} characters`,
    })
    // Allowlist safe characters only.
    // Prevents homograph attacks, injection attempts, and rendering issues.
    // Allows: letters, numbers, underscores, hyphens.
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message:
        "Username can only contain letters, numbers, underscores, and hyphens",
    }),

  password: z
    .string()
    .min(PASSWORD_MIN, {
      message: `Password must be at least ${PASSWORD_MIN} characters`,
    })
    // Cap password length to prevent DoS via bcrypt.
    // bcrypt is intentionally slow — a 1MB password string = seconds of CPU per request.
    .max(PASSWORD_MAX, {
      message: `Password cannot exceed ${PASSWORD_MAX} characters`,
    }),
});

export const SigninSchema = z.object({
  username: z
    .string()
    .trim()
    .min(USERNAME_MIN, {
      message: `Username must be at least ${USERNAME_MIN} characters`,
    })
    .max(USERNAME_MAX),

  password: z
    .string()
    // IMPORTANT: Always cap password length on login — not for policy enforcement,
    // but to prevent CPU exhaustion DoS via bcrypt.compare() on massive payloads.
    // bcrypt.compare() on a 10MB string at 10 rounds can block Node's event loop
    // for seconds — multiply by concurrent requests and your server stalls.
    .min(1, { message: "Password is required" })
    .max(PASSWORD_MAX),
});

import { CONTENT_TYPES } from "../db/models/Content.js"; // Use exported constant

export const CreateContentSchema = z
  .object({
    title: z.string().trim().min(1).max(500),
    type: z.enum(CONTENT_TYPES),
    // type: z.string().trim().toLowerCase().enum(CONTENT_TYPES),
    link: z.string().url().optional(),
    textContent: z.string().max(50000).optional(),
    isPublic: z
      .preprocess((val) => {
        if (typeof val === "string") return val === "true";
        return val;
      }, z.boolean())
      .optional()
      .default(false),
    tags: z.array(z.string()).optional().default([]),
  })
  .refine(
    // Business rule: non-note types should have either a link or textContent
    (data) =>
      data.type === "note" ||
      data.type === "document" ||
      data.link ||
      data.textContent,
    { message: "Content must have either a link or text content" },
  );

// export const UpdateContentSchema = CreateContentSchema.partial();
// PATCH = partial update — every field optional.
// .partial() makes all CreateContentSchema fields optional automatically.
// But we add extra rules: some fields must never be updatable after creation.
export const UpdateContentSchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    textContent: z.string().max(50000).optional(),
    isPublic: z
      .preprocess((val) => {
        if (typeof val === "string") return val === "true";
        return val;
      }, z.boolean())
      .optional(),
    tags: z.array(z.string()).optional(),

    // type and link are intentionally excluded.
    // Changing type after creation would invalidate embeddings, Cloudinary files,
    // and break the entire content model — disallow at schema level.
    // link is the source of truth for external content — not user-editable post-creation.
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided for update" },
    // Reject empty PATCH body — {} with no fields is a no-op request
  );

export const ShareLinkSchema = z.object({
  share: z.boolean({
    required_error: "'share' is required",
    invalid_type_error: "'share' must be a boolean",
  }),
});

// import z from "zod";

export const SearchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, { message: "Search query cannot be empty" })
    .max(1000, { message: "Query cannot exceed 1000 characters" }),
});
