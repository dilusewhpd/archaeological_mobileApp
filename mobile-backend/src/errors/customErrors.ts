import { AppError } from "./AppError.js";

export class BadRequestError extends AppError {
  constructor(message = "Bad request.") {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized.") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden.") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found.") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists.") {
    super(message, 409);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed.") {
    super(message, 422);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message = "Business rule violation.") {
    super(message, 422);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable.") {
    super(message, 503);
  }
}