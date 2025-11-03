import type { Request, Response, NextFunction } from "express"
import { v4 as uuidv4 } from "uuid"

declare global {
  namespace Express {
    interface Request {
      id: string
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.id = (req.headers["x-request-id"] as string) || uuidv4()
  res.setHeader("X-Request-ID", req.id)
  next()
}
