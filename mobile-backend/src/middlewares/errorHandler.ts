import { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { AppError } from "../errors/AppError.js";

const MULTER_ERROR_MESSAGES: Partial<Record<MulterError["code"], string>> = {
  LIMIT_FILE_SIZE: "File is too large. Maximum size is 10MB.",
  LIMIT_FILE_COUNT: "Too many files uploaded at once.",
  LIMIT_UNEXPECTED_FILE: "Unexpected file field.",
};

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof MulterError) {
    return res.status(400).json({
      success: false,
      message: MULTER_ERROR_MESSAGES[error.code] ?? "File upload failed.",
    });
  }

  console.error(error);

  return res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
};