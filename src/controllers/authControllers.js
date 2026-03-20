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
