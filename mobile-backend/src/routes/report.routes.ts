import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import {
  getMySitesReportController,
  getMyReviewsReportController,
  getRiskAssessmentReportController,
} from "../controllers/report.controller.js";
import { ROLES } from "../utils/constants/auth.constants.js";

const router: ReturnType<typeof Router> = Router();

router.get(
  "/my-sites",
  authenticate,
  authorize(ROLES.FIELD_OFFICER, ROLES.SENIOR_OFFICER),
  getMySitesReportController
);

router.get(
  "/my-reviews",
  authenticate,
  authorize(ROLES.SENIOR_OFFICER),
  getMyReviewsReportController
);

router.get(
  "/risk-assessment",
  authenticate,
  authorize(ROLES.ANALYST),
  getRiskAssessmentReportController
);

export default router;
