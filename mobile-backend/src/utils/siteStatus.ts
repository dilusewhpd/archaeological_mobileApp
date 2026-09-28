import { SiteStatus } from "@prisma/client";
import { BusinessRuleError } from "../errors/customErrors.js";

export const ensureSiteStatus = (
  currentStatus: SiteStatus,
  allowedStatuses: SiteStatus[],
  message?: string
): void => {
  if (!allowedStatuses.includes(currentStatus)) {
    throw new BusinessRuleError(
      message ??
        `Operation is not allowed when the site status is '${currentStatus}'.`
    );
  }
};