import { NextFunction, Request, Response } from "express";
import { RoleName } from "../utils/constants/auth.constants.js";

export const authorize =
  (...allowedRoles: RoleName[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });

      return;
    }

    if (!allowedRoles.includes(req.user.role as RoleName)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });

      return;
    }

    next();
  };