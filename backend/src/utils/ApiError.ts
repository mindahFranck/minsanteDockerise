export class ApiError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(404, message)
  }
}

export class ValidationError extends ApiError {
  constructor(message = "Validation failed") {
    super(400, message)
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized access") {
    super(401, message)
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden access") {
    super(403, message)
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Resource conflict") {
    super(409, message)
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad request") {
    super(400, message)
  }
}
