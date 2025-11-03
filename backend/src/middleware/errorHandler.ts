import type { Request, Response, NextFunction } from "express"
import { ApiError } from "../utils/ApiError"

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    })
  }

  // Sequelize validation errors
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: err.message,
    })
  }

  // Sequelize unique constraint errors
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      success: false,
      error: "Resource already exists",
    })
  }

  // Sequelize foreign key constraint errors
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      success: false,
      error: "Invalid reference to related resource",
    })
  }

  console.error("[v0] Unhandled error:", err)

  return res.status(500).json({
    success: false,
    error: "Internal server error",
  })
}
