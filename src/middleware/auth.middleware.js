import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import UserModel from "../model/user.schema.js";
import { ResponseUtil, ApiError, HTTP_STATUS } from "../utils/index.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "your-secret-key";

    if (!token) {
      ResponseUtil.unauthorized(res, "Access token required");
      return;
    }

    const decoded = jwt.verify(token, secret);

    // Verify user still exists and is active
    const user = await UserModel.findById(decoded.id).select("_id email");

    if (!user) {
      ResponseUtil.unauthorized(res, "Invalid or expired token");
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
    };

    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      ResponseUtil.unauthorized(res, "Invalid token");
    } else {
      ResponseUtil.serverError(res, "Token verification failed");
    }
  }
};

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");

      throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, errorMessage);
    }

    next();
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");

      throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, errorMessage);
    }

    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.userId).select(
        "_id role mobile email isActive"
      );

      if (user && user.isActive) {
        req.user = {
          id: user._id.toString(),
          role: user.role,
          mobile: user.mobile,
          email: user.email,
        };
      }
    }

    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};
