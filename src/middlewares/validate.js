export const validate = (schema) => (req, res, next) => {
  // console.log("BODY:", req.body);
  // console.log("FILE:", req.file?.originalname);
  const result = schema.safeParse(req.body);

  // if (!result.success) {
  //   return res.status(400).json({
  //     message: "Validation failed",
  //     // Zod's flattened errors are clean for frontend consumption
  //     errors: result.error.flatten().fieldErrors,
  //   });
  // }
  if (!result.success) {
    console.log(result.error.flatten());

    return res.status(400).json({
      message: "Validation failed",
      errors: result.error.flatten(),
    });
  }
  // Replace req.body with the parsed, validated, and transformed data.
  // This ensures controllers receive trimmed, lowercased, coerced values —
  // not the raw untrusted client input.
  req.body = result.data;
  next();
};

// Add to middlewares/validate.js

// Validates that a route parameter is a valid MongoDB ObjectId.
// Without this, sending DELETE /content/not-an-id causes Mongoose to throw
// a CastError, which surfaces as an unhandled 500 instead of a clean 400.
import mongoose from "mongoose";

export const validateObjectId = (paramName) => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    return res.status(400).json({
      message: `Invalid ${paramName} format`,
    });
  }
  next();
};
