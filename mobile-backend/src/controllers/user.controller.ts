import { NextFunction, Request, Response } from "express";

import * as userService from "../services/user.service.js";
import { GetUsersQuery, UpdateUserInput, UserIdParam } from "../validators/user.validation.js";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {

  try {

    const result =
      await userService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: result,
    });

  } catch (error) {
    next(error);
  }

};

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.validatedQuery as GetUsersQuery;

	const result = await userService.getUsers(query);
	
    res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await userService.getUserById(
      req.params as UserIdParam
    );

    res.status(200).json({
      success: true,
      message: "User retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await userService.updateUser(
      req.params as UserIdParam,
      req.body as UpdateUserInput
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await userService.deleteUser(
      req.params as UserIdParam,
      req.user?.userId as string
    );

    res.status(200).json({
      success: true,
      message: "User deactivated successfully.",
    });
  } catch (error) {
    next(error);
  }
};

export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await userService.resetUserPassword(
      req.params as UserIdParam
    );

    res.status(200).json({
      success: true,
      message: "Password reset successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};