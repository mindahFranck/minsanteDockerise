import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";
import compression from "compression";
import path from "path";
import sequelize from "./config/database";
import { swaggerSpec } from "./config/swagger";
// 🚨 Remove the direct import of setupAssociations since it's called in initializeDatabase
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { requestIdMiddleware } from "./middleware/requestId";
import { requestLogger } from "./middleware/requestLogger";
import { logger } from "./config/logger";
import { morganStream } from "./config/logger";
import importGeoData from "./scripts/importGeoData";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || "v1";

app.use(requestIdMiddleware);
app.use(compression());

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev", { stream: morganStream }));
} else {
  app.use(morgan("combined", { stream: morganStream }));
}

app.use(requestLogger);

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use(`/api/${API_VERSION}`, routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Error handling middleware
app.use(errorHandler);

// Database connection and server start
async function startServer() {
  try {
    // 🚨 REMOVED: setupAssociations() - it's called inside initializeDatabase()

    // Test database connection
    await sequelize.authenticate();
    logger.info("Database connection established successfully");

    // Sync database (use { alter: true } in development, migrations in production)
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      logger.info("Database synchronized");

      // Import geographic data on first run
      // await importGeoData();
    } else {
      // In production, just ensure tables exist without altering
      await sequelize.sync();
      logger.info("Database tables verified");
    }

    // Initialize database with roles, permissions, and default users (idempotent)
    // This function calls setupAssociations() internally
    // const { initializeDatabase } = await import("./database/initializer");
    // await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`API Base URL: http://localhost:${PORT}/api/${API_VERSION}`);
      logger.info(
        `Health Check: http://localhost:${PORT}/api/${API_VERSION}/health`
      );
    });
  } catch (error) {
    logger.error("Unable to start server:", error);
    process.exit(1);
  }
}

startServer();

export default app;
