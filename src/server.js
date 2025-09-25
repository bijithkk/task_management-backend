import dotenv from 'dotenv';
import http from "http";
import { config } from "./config/index.js";
import { connectDatabase, disconnectDatabase } from "./database/connection.js";
import { logger } from "./utils/logger.js";
import app from "./app.js";

dotenv.config();

// Create HTTP server
const server = http.createServer(app);

// Graceful shutdown function
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close((err) => {
    if (err) {
      logger.error("Error during server shutdown:", err);
      process.exit(1);
    }

    logger.info("HTTP server closed");

    // Close database connection
    disconnectDatabase();
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 30000);
};

// Handle process termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start server function
const startServer = async () => {
  try {
    // Connect to database first
    await connectDatabase();
    logger.info("Database connected successfully");

    // Start HTTP server
    const port = config.port || 7000;
    server.listen(port, () => {
      logger.info(`📚 API Base URL: http://localhost:${port}/api/v1`);
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.syscall !== "listen") {
        throw error;
      }

      const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

      switch (error.code) {
        case "EACCES":
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case "EADDRINUSE":
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
