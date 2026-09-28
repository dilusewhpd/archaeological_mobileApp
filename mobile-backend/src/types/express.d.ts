import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };

      validatedQuery?: unknown;
      validatedParams?: unknown;
      // validatedBody?: unknown;
    }
  }
}

export {};