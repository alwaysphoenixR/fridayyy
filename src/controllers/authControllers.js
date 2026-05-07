// // controllers/authControllers.js
// import jwt from "jsonwebtoken";
// import bcrypt from "bcrypt";
// import { userModel } from "../db/models/User.js";
// import { CreateUserSchema, SigninSchema } from "../utils/types.js";

// const JWT_SECRET = process.env.JWT_SECRET;

// export const signup = async (req, res) => {
//   try {
//     const parsedData = CreateUserSchema.safeParse(req.body);
//     if (!parsedData.success) {
//       return res.status(400).json({
//         message: "Incorrect inputs",
//         err: parsedData.error.issues, // .issues gives a cleaner error array for the frontend
//       });
//     }

//     const { username, password } = parsedData.data;

//     const existingUser = await userModel.findOne({ username });
//     if (existingUser) {
//       return res.status(409).json({
//         message: "User already exists. Please log in.",
//       });
//     }

//     const saltRounds = 10;
//     const hashedPassword = await bcrypt.hash(password, saltRounds);

//     const newUser = await userModel.create({
//       username: username,
//       password: hashedPassword,
//     });

//     return res.status(201).json({
//       message: "Account created successfully",
//       data: {
//         username: newUser.username,
//         userId: newUser._id,
//       },
//     });
//   } catch (err) {
//     console.error("Signup Error:", err);
//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };

// export const login = async (req, res) => {
//   try {
//     const parsedData = SigninSchema.safeParse(req.body);
//     if (!parsedData.success) {
//       return res.status(400).json({
//         message: "Incorrect inputs",
//         err: parsedData.error.issues,
//       });
//     }

//     const { username, password } = parsedData.data;

//     const getUser = await userModel.findOne({ username });
//     if (!getUser) {
//       return res.status(401).json({
//         // 401 Unauthorized is best for bad credentials
//         message: "Invalid username or password",
//       });
//     }

//     //  Compare the plain text to the hashed password
//     const isPasswordValid = await bcrypt.compare(password, getUser.password);
//     if (!isPasswordValid) {
//       return res.status(401).json({
//         message: "Invalid username or password",
//       });
//     }

//     // Safety Check: Ensure JWT_SECRET exists
//     if (!JWT_SECRET) {
//       throw new Error("JWT_SECRET is not defined in environment variables");
//     }

//     const token = jwt.sign({ userId: getUser._id.toString() }, JWT_SECRET);

//     return res.status(200).json({
//       message: "Logged in successfully",
//       token: token,
//     });
//   } catch (err) {
//     console.error("Login Error:", err);
//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };

// controllers/authControllers.js
import { userModel } from "../db/models/User.js";
import { CreateUserSchema, SigninSchema } from "../utils/types.js";
import jwt from "jsonwebtoken";

// Helper to generate and save tokens
const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await userModel.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token to DB for rotation/revocation
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error("Error while generating tokens");
  }
};

export const signup = async (req, res) => {
  try {
    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res
        .status(400)
        .json({ message: "Incorrect inputs", err: parsedData.error.issues });
    }

    const { username, password } = parsedData.data;

    const existingUser = await userModel.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists." });
    }

    // Passwords are now hashed automatically in the Model's pre-save hook!
    const newUser = await userModel.create({ username, password });

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      newUser._id,
    );

    return res
      .status(201)
      .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true })
      .json({
        message: "Account created successfully",
        accessToken,
        username: newUser.username,
      });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({ message: "Incorrect inputs" });
    }

    const { username, password } = parsedData.data;

    const user = await userModel.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Using the method we added to the User Model
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id,
    );

    const options = {
      httpOnly: true, // Prevents XSS access
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    };

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, options)
      .json({
        message: "Logged in successfully",
        accessToken, // Frontend stores this in state (memory)
        user: { username: user.username, id: user._id },
      });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    // 1. Clear the Refresh Token in the Database
    // We get the user ID from the 'authMiddleware' (which we'll write next)
    await userModel.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined, // Or use $unset to remove the field entirely
        },
      },
      {
        new: true,
      },
    );

    // 2. Clear the Cookie in the Browser
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    };

    return res
      .status(200)
      .clearCookie("refreshToken", options) // Clears the browser cookie
      .json({ message: "User logged out successfully" });
  } catch (err) {
    console.error("Logout Error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error during logout" });
  }
};
// import { userModel } from "../db/models/User.js";

export const refreshAccessToken = async (req, res) => {
  // 1. Get the token from cookies
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ message: "No refresh token found" });
  }

  try {
    // 2. Verify the token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    // 3. Find user and check if token matches the one in DB
    const user = await userModel.findById(decodedToken?._id);

    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Security check: Does the cookie token match the DB token?
    // If they don't match, the token might have been used/stolen
    if (incomingRefreshToken !== user.refreshToken) {
      return res
        .status(401)
        .json({ message: "Refresh token is expired or used" });
    }

    // 4. Generate NEW tokens (Refresh Token Rotation)
    const accessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    // 5. Update the DB with the NEW refresh token
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    // 6. Send response
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    };

    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, options)
      .json({
        message: "Access token refreshed",
        accessToken, // New access token for frontend state
      });
  } catch (error) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};
