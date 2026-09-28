import { Router } from "express";
import { createUser, deleteUser, getUserById, getUsers, resetUserPassword, updateUser } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { ROLES } from "../utils/constants/auth.constants.js";
import { createUserSchema, getUsersQuerySchema, updateUserSchema, userIdParamSchema } from "../validators/user.validation.js";
import { validateQuery } from "../middlewares/validateQuery.js";
import { validateParams } from "../middlewares/validateParams.js";

const router: ReturnType<typeof Router> = Router();

router.post(
  "/",
  authenticate,
  authorize(ROLES.ADMIN),
  validate(createUserSchema),
  createUser
);

router.get(
  "/",
  authenticate,
  authorize(ROLES.ADMIN),
  validateQuery(getUsersQuerySchema),
  getUsers
);

router.get(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN),
  validateParams(userIdParamSchema),
  getUserById
);

router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN),
  validateParams(userIdParamSchema),
  validate(updateUserSchema),
  updateUser
);

router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN),
  validateParams(userIdParamSchema),
  deleteUser
);

router.post(
  "/:id/reset-password",
  authenticate,
  authorize(ROLES.ADMIN),
  validateParams(userIdParamSchema),
  resetUserPassword
);

export default router;