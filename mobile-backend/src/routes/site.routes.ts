import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { createSiteSchema } from "../validators/sites/create-site.validation.js";
import { approveSiteController, createSiteController, getMySitesController, getSiteByIdController, getSiteDashboardController, getSiteRiskController, getSitesController, getSiteWorkflowHistoryController, rejectSiteController, submitSiteController, updateSiteController, uploadSitePhotoController } from "../controllers/site.controller.js";
import { uploadSitePhotoMiddleware } from "../middlewares/upload.middleware.js";
import { ROLES } from "../utils/constants/auth.constants.js";
import { getSitesQuerySchema } from "../validators/sites/get-sites.validation.js";
import { validateQuery } from "../middlewares/validateQuery.js";
import { validateParams } from "../middlewares/validateParams.js";
import { rejectSiteSchema, siteIdParamSchema, updateSiteSchema } from "../validators/sites/index.js";

const router: ReturnType<typeof Router> = Router();

router.post(
    "/",
    authenticate,
    authorize(ROLES.FIELD_OFFICER, ROLES.SENIOR_OFFICER),
    validate(createSiteSchema),
    createSiteController,
);

router.get(
  "/",
  authenticate,
  authorize(
    ROLES.ADMIN,
    ROLES.SENIOR_OFFICER,
    ROLES.FIELD_OFFICER,
    ROLES.ANALYST,
  ),
  validateQuery(getSitesQuerySchema),
  getSitesController
);

router.get(
  "/my-sites",
  authenticate,
  authorize(ROLES.FIELD_OFFICER, ROLES.SENIOR_OFFICER),
  validateQuery(getSitesQuerySchema),
  getMySitesController
);

router.get(
  "/dashboard",
  authenticate,
  authorize(
    ROLES.ADMIN,
    ROLES.SENIOR_OFFICER,
    ROLES.FIELD_OFFICER,
    ROLES.ANALYST
  ),
  getSiteDashboardController
);

router.get(
  "/:id/history",
  authenticate,
  authorize(
    ROLES.ADMIN,
    ROLES.SENIOR_OFFICER,
    ROLES.FIELD_OFFICER,
    ROLES.ANALYST
  ),
  validateParams(siteIdParamSchema),
  getSiteWorkflowHistoryController
);

router.get(
  "/:id/risk",
  authenticate,
  authorize(
    ROLES.ADMIN,
    ROLES.SENIOR_OFFICER,
    ROLES.ANALYST
  ),
  validateParams(siteIdParamSchema),
  getSiteRiskController
);

router.get(
  "/:id",
  authenticate,
  authorize(
    ROLES.ADMIN,
    ROLES.SENIOR_OFFICER,
    ROLES.FIELD_OFFICER,
    ROLES.ANALYST,
  ),
  validateParams(siteIdParamSchema),
  getSiteByIdController
);

router.put(
  "/:id",
  authenticate,
  authorize(
    ROLES.ADMIN,
    ROLES.SENIOR_OFFICER,
    ROLES.FIELD_OFFICER
  ),
  validateParams(siteIdParamSchema),
  validate(updateSiteSchema),
  updateSiteController
);

router.post(
  "/:id/submit",
  authenticate,
  authorize(
    ROLES.ADMIN,
    ROLES.SENIOR_OFFICER,
    ROLES.FIELD_OFFICER
  ),
  validateParams(siteIdParamSchema),
  submitSiteController
);

router.post(
  "/:id/approve",
  authenticate,
  authorize(
    ROLES.ADMIN,
    ROLES.SENIOR_OFFICER
  ),
  validateParams(siteIdParamSchema),
  approveSiteController
);

router.post(
  "/:id/reject",
  authenticate,
  authorize(
    ROLES.ADMIN,
    ROLES.SENIOR_OFFICER
  ),
  validateParams(siteIdParamSchema),
  validate(rejectSiteSchema),
  rejectSiteController
);

router.post(
  "/:id/photos",
  authenticate,
  authorize(
    ROLES.ADMIN,
    ROLES.SENIOR_OFFICER,
    ROLES.FIELD_OFFICER
  ),
  validateParams(siteIdParamSchema),
  uploadSitePhotoMiddleware.single("photo"),
  uploadSitePhotoController
);

export default router;
