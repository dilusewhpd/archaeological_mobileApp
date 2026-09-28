import { RequestHandler } from "express";
import { ZodError, ZodSchema } from "zod";

export const validateQuery =
  <T>(schema: ZodSchema<T>): RequestHandler =>
  (req, res, next) => {
    try {
      req.validatedQuery = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation failed.",
          errors: err.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });

        return;
      }

      next(err);
    }
  };