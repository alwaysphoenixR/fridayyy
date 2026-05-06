import jwt from "jsonwebtoken";
import { userModel } from "../db/models/User.js";
const JWT_SECRET = process.env.JWT_SECRET;
import { CreateUserSchema, SigninSchema } from "../utils/types.js";
export const signup = async (req, res) => {
  try {
    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(411).json({
        message: "INCORRECT INPUTS",
        err: parsedData.error,
      });
    }
    const { username, password } = parsedData.data;
    // if (!username || !password)
    //   return res.status(411).json({
    //     message: "Error in inputs",
    //   });

    const existingUser = await userModel.findOne({ username: username });
    if (existingUser) {
      return res.status(403).json({
        message: "USER already exists move to login",
      });
    }
    const newUser = await userModel.create({
      username: username,
      password: password,
    });
    return res.status(200).json({
      message: "Signed Up",
      data: newUser.username,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({
        message: "INCORRECT INPUTS",
        err: parsedData.error,
      });
    }
    const { username, password } = parsedData.data;

    // const { username, password } = req.body;
    // if (!username || !password)
    //   return res.status(411).json({
    //     message: "Error in inputs fill all",
    //   });
    const getUser = await userModel.findOne({ username: username });
    if (!getUser) {
      return res.status(403).json({
        message: "WRONG EMAIL OR PASSWORD",
      });
    }
    if (password !== getUser.password) {
      return res.status(403).json({
        message: "WRONG EMAIL OR PASSWORD",
      });
    }
    const token = jwt.sign(
      {
        userId: getUser._id.toString(),
      },
      JWT_SECRET,
    );
    return res.status(200).json({
      message: "signedup",
      token: token,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

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
//         // 409 Conflict is best for "Resource already exists"
//         message: "User already exists. Please log in.",
//       });
//     }

//     // Security Upgrade: Hash the password before saving
//     const saltRounds = 10;
//     const hashedPassword = await bcrypt.hash(password, saltRounds);

//     const newUser = await userModel.create({
//       username: username,
//       password: hashedPassword,
//     });

//     return res.status(201).json({
//       // 201 Created is the standard for successful creation
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

//     // Security Upgrade: Compare the plain text to the hashed password
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
