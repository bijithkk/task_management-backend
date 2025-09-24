import winston from "winston";
import path from "path";
import { config } from "../config/index.js";

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), logFormat),
  }),
];

// Add file transports in production
if (config.nodeEnv === "production") {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/combined.log"),
    })
  );
}

export const logger = winston.createLogger({
  level: config.nodeEnv === "production" ? "info" : "debug",
  format: logFormat,
  transports,
  exitOnError: false,
});
