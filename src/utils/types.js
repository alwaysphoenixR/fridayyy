// types.js
import z from "zod";

export const CreateUserSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(20, { message: "Username cannot exceed 20 characters" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(100), // Prevents Denial of Service (DoS) attacks from massive payloads
});

export const SigninSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string(), // No need for strict length checks here, we just check if it matches the DB!
});
