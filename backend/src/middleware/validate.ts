import type { Request, Response, NextFunction } from "express"
import { validationResult } from "express-validator"
import { ValidationError } from "../utils/ApiError"
import { z } from "zod"

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => `${err.type === "field" ? err.path : "unknown"}: ${err.msg}`)
      .join(", ")

    return next(new ValidationError(errorMessages))
  }

  next()
}

export const validateSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ")
        return next(new ValidationError(errorMessages))
      }
      next(error)
    }
  }
}

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query)
      req.query = validated as any
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ")
        return next(new ValidationError(errorMessages))
      }
      next(error)
    }
  }
}
