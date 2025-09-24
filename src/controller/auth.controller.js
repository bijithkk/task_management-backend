import {
  ResponseUtil,
  asyncHandler,
  ApiError,
  HTTP_STATUS,
} from "../utils/index.js";
import UserModel from "../model/user.schema.js";
import generateAccessToken from '../utils/jwt.js'

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    throw new ApiError(HTTP_STATUS.CONFLICT, "User already exists");
  }
  const newUser = new UserModel({ name, email, password });
  await newUser.save();

  const userResponse = {
    id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    createdAt: newUser.createdAt,
  };
  return ResponseUtil.created(
    res,
    userResponse,
    "User registered successfully"
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email });
  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid email or password");
  }

  const payload = { id: user._id };
  const accessToken = generateAccessToken(payload);

  return ResponseUtil.success(res, "User logged in successfully.", {
    user: {
      id: user._id,
      email: user.email,
    },
    accessToken,
  });
});