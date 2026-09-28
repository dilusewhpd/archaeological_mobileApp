import { Router } from "express";
import { changePassword, login, me, register } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.js";
import { changePasswordSchema, loginSchema, registerSchema } from "../validators/auth.validation.js";
import { authenticate } from "../middlewares/authenticate.js";
import { ROLES } from "../utils/constants/auth.constants.js";
import { authorize } from "../middlewares/authorize.js";

const router: ReturnType<typeof Router> = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", authenticate, me);

router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  changePassword
);

export default router;