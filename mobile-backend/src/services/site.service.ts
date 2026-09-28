import { Prisma, SiteStatus, SiteWorkflowAction } from "@prisma/client";
import { prisma } from "../config/prismaDb.js";
import { BusinessRuleError, ConflictError, ForbiddenError, NotFoundError } from "../errors/customErrors.js";
import { CreateSiteData, GetSitesQuery, RejectSiteData, UpdateSiteData } from "../moduleTypes/sites/sites.types.js";
import { assessSiteRisk } from "./risk.service.js";
import { ROLES } from "../utils/constants/auth.constants.js";
import { siteDetailsSelect } from "../utils/constants/site.constant.js";
import { ensureSiteStatus } from "../utils/siteStatus.js";

export const createSite = async (
  data: CreateSiteData,
  currentUserId: string
) => {
  const existingSite = await prisma.site.findUnique({
    where: {
      siteCode: data.siteCode,
    },
  });

  if (existingSite) {
    throw new ConflictError(
      `Site with code '${data.siteCode}' already exists.`
    );
  }

  const site = await prisma.$transaction(async (tx) => {
    const createdSite = await tx.site.create({
      data: {
        ...data,

        createdById: currentUserId,
        updatedById: currentUserId,
      },

      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    await tx.siteWorkflowHistory.create({
      data: {
        siteId: createdSite.id,
        action: SiteWorkflowAction.CREATED,
        performedById: currentUserId,
      },
    });

    return createdSite;
  },{
    timeout: 300000, // timeout in 5 minutes
  });

  return site;
};

export const getSites = async (
  query: GetSitesQuery,
  createdById?: string
) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const sortBy = ("sortBy" in query && query.sortBy) ? query.sortBy : "createdAt";
  const sortOrder = ("sortOrder" in query && query.sortOrder) ? query.sortOrder : "desc";

  const {
    search,
    status,
    historicalPeriod,
    siteType,
    province,
    district,
  } = query;

  const skip = (page - 1) * limit;

  const where: Prisma.SiteWhereInput = {
    ...(createdById && {
      createdById,
    }),

    ...(search && {
      OR: [
        {
          name: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          siteCode: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ],
    }),

    ...(status && { status }),

    ...(historicalPeriod && { historicalPeriod }),

    ...(siteType && { siteType }),

    ...(province && {
      province: {
        contains: province,
        mode: Prisma.QueryMode.insensitive,
      },
    }),

    ...(district && {
      district: {
        contains: district,
        mode: Prisma.QueryMode.insensitive,
      },
    }),
  };

  const sites = await prisma.site.findMany({
      where,
      skip,
      take: Number(limit),

      orderBy: {
        [sortBy as string]: sortOrder,
      },

      select: {
        id: true,
        siteCode: true,
        name: true,

        province: true,
        district: true,
        divisionalSecretariat: true,

        latitude: true,
        longitude: true,

        historicalPeriod: true,
        siteType: true,

        status: true,

        createdAt: true,
        updatedAt: true,

        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },

        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    const total = await prisma.site.count({
      where,
    });

  return {
    data: sites,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getSiteById = async (
  id: string
) => {
  const site = await prisma.site.findUnique({
    where: {
      id,
    },

    select: siteDetailsSelect
  });

  if (!site) {
    throw new NotFoundError("Site not found.");
  }

  return site;
};

export const updateSite = async (
  id: string,
  data: UpdateSiteData,
  currentUserId: string,
  currentUserRole: string
) => {
  const site = await prisma.site.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      createdById: true,
    },
  });

  if (!site) {
    throw new NotFoundError("Site not found.");
  }

  if (
    currentUserRole === ROLES.FIELD_OFFICER &&
    site.createdById !== currentUserId
  ) {
    throw new ForbiddenError(
      "You can only update sites you created."
    );
  }

  if (currentUserRole === ROLES.ANALYST) {
    throw new ForbiddenError(
      "You are not authorized to update sites."
    );
  }

  const updatedSite = await prisma.$transaction(async (tx) => {
    const { count } = await tx.site.updateMany({
      where: {
        id,
        status: { in: [SiteStatus.DRAFT, SiteStatus.REJECTED] },
      },
      data: {
        ...data,
        updatedById: currentUserId,
      },
    });

    if (count === 0) {
      throw new BusinessRuleError("Only draft or rejected sites can be updated.");
    }

    await tx.siteWorkflowHistory.create({
      data: {
        siteId: id,
        action: SiteWorkflowAction.UPDATED,
        performedById: currentUserId,
      },
    });

    return tx.site.findUniqueOrThrow({
      where: { id },
      select: siteDetailsSelect,
    });
  });

  return updatedSite;
};

export const submitSite = async (
  id: string,
  currentUserId: string,
  currentUserRole: string
) => {
  const site = await prisma.site.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      createdById: true,
    },
  });

  if (!site) {
    throw new NotFoundError("Site not found.");
  }

  // Field Officers can only submit their own sites
  if (
    currentUserRole === ROLES.FIELD_OFFICER &&
    site.createdById !== currentUserId
  ) {
    throw new ForbiddenError(
      "You can only submit sites you created."
    );
  }

  // Analysts cannot submit sites
  if (currentUserRole === ROLES.ANALYST) {
    throw new ForbiddenError(
      "You are not authorized to submit sites."
    );
  }

  // DRAFT sites and REJECTED sites (revised, then resubmitted) can be
  // submitted. The ownership/role checks above are read-then-act too, but
  // a user's own role/authorship can't change mid-request the way a site's
  // workflow status can — only the status transition itself needs the
  // atomic updateMany guard below (see approveSite).
  const submittedSite = await prisma.$transaction(
    async (tx) => {
      const { count } = await tx.site.updateMany({
        where: {
          id,
          status: { in: [SiteStatus.DRAFT, SiteStatus.REJECTED] },
        },
        data: {
          status: SiteStatus.PENDING,
          submittedAt: new Date(),
          // A fresh submission starts clean — the prior rejection does not
          // carry forward on the live record (the workflow history keeps it).
          rejectedAt: null,
          rejectionReason: null,
          updatedById: currentUserId,
        },
      });

      if (count === 0) {
        throw new BusinessRuleError("Only draft or rejected sites can be submitted for review.");
      }

      await tx.siteWorkflowHistory.create({
        data: {
          siteId: id,
          action: SiteWorkflowAction.SUBMITTED,
          performedById: currentUserId,
        },
      });

      return tx.site.findUniqueOrThrow({
        where: { id },
        select: siteDetailsSelect,
      });
    },{
      timeout: 300000, // timeout in 5 minutes
    }
  );

  return submittedSite;
};

export const approveSite = async (
  id: string,
  currentUserId: string
) => {
  const approvedSite = await prisma.$transaction(
    async (tx) => {
      // A conditional updateMany (rather than findUnique + a separate
      // update) makes the status check and the write atomic — Postgres
      // serializes concurrent UPDATEs on the same row, so a duplicate
      // approve request (e.g. a double-click that fired two requests)
      // matches 0 rows on its turn instead of silently approving twice.
      const { count } = await tx.site.updateMany({
        where: {
          id,
          status: SiteStatus.PENDING,
        },
        data: {
          status: SiteStatus.APPROVED,
          approvedAt: new Date(),
          approvedById: currentUserId,
          updatedById: currentUserId,
        },
      });

      if (count === 0) {
        const site = await tx.site.findUnique({ where: { id }, select: { id: true } });
        if (!site) {
          throw new NotFoundError("Site not found.");
        }
        throw new BusinessRuleError("Only pending sites can be approved.");
      }

      await tx.siteWorkflowHistory.create({
        data: {
          siteId: id,
          action: SiteWorkflowAction.APPROVED,
          performedById: currentUserId,
        },
      });

      return tx.site.findUniqueOrThrow({
        where: { id },
        select: siteDetailsSelect,
      });
    },{
      timeout: 300000, // timeout in 5 minutes
    }
  );

  return approvedSite;
};

export const rejectSite = async (
  id: string,
  data: RejectSiteData,
  currentUserId: string
) => {
  const rejectedSite = await prisma.$transaction(async (tx) => {
    // See approveSite — an atomic conditional updateMany closes the same
    // double-submit race for rejection.
    const { count } = await tx.site.updateMany({
      where: {
        id,
        status: SiteStatus.PENDING,
      },
      data: {
        status: SiteStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: data.rejectionReason,
        updatedById: currentUserId,
      },
    });

    if (count === 0) {
      const site = await tx.site.findUnique({ where: { id }, select: { id: true } });
      if (!site) {
        throw new NotFoundError("Site not found.");
      }
      throw new BusinessRuleError("Only pending sites can be rejected.");
    }

    await tx.siteWorkflowHistory.create({
      data: {
        siteId: id,
        action: SiteWorkflowAction.REJECTED,
        remarks: data.rejectionReason,
        performedById: currentUserId,
      },
    });

    return tx.site.findUniqueOrThrow({
      where: { id },
      select: siteDetailsSelect,
    });
  },{
      timeout: 300000, // timeout in 5 minutes
  });

  return rejectedSite;
};

export const getSiteDashboard = async (
  currentUserId?: string
) => {
  const where = currentUserId
    ? {
        createdById: currentUserId,
      }
    : {};

  const [
    draft,
    pending,
    approved,
    rejected,
    total,
  ] = await Promise.all([
    prisma.site.count({
      where: {
        ...where,
        status: SiteStatus.DRAFT,
      },
    }),

    prisma.site.count({
      where: {
        ...where,
        status: SiteStatus.PENDING,
      },
    }),

    prisma.site.count({
      where: {
        ...where,
        status: SiteStatus.APPROVED,
      },
    }),

    prisma.site.count({
      where: {
        ...where,
        status: SiteStatus.REJECTED,
      },
    }),

    prisma.site.count({
      where,
    }),
  ]);

  return {
    draft,
    pending,
    approved,
    rejected,
    total,
  };
};

export const getSiteWorkflowHistory = async (
  id: string,
  currentUserId: string,
  currentUserRole: string
) => {
  const site = await prisma.site.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      createdById: true,
    },
  });

  if (!site) {
    throw new NotFoundError("Site not found.");
  }

  if (
    currentUserRole === ROLES.FIELD_OFFICER &&
    site.createdById !== currentUserId
  ) {
    throw new ForbiddenError(
      "You are not allowed to view this site's workflow history."
    );
  }

  const history = await prisma.siteWorkflowHistory.findMany({
    where: {
      siteId: id,
    },

    orderBy: {
      createdAt: "asc",
    },

    select: {
      id: true,

      action: true,

      remarks: true,

      createdAt: true,

      performedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return history;
};

/**
 * GET /api/sites/:id/risk — only APPROVED sites have a risk profile; a
 * draft/pending/rejected site hasn't been verified as a real site yet, so
 * scoring it doesn't make sense.
 */
export const getSiteRiskAssessment = async (id: string) => {
  const site = await prisma.site.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!site) {
    throw new NotFoundError("Site not found.");
  }

  ensureSiteStatus(
    site.status,
    [SiteStatus.APPROVED],
    "Only approved sites have a risk profile."
  );

  return assessSiteRisk(site.id, Number(site.latitude), Number(site.longitude));
};

export const uploadSitePhoto = async (
  siteId: string,
  file: Express.Multer.File,
  caption: string | undefined,
  currentUserId: string,
  currentUserRole: string
) => {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      createdById: true,
      status: true,
    },
  });

  if (!site) {
    throw new NotFoundError("Site not found.");
  }

  if (
    currentUserRole === ROLES.FIELD_OFFICER &&
    site.createdById !== currentUserId
  ) {
    throw new ForbiddenError("You can only upload photos to sites you created.");
  }

  const photo = await prisma.sitePhoto.create({
    data: {
      siteId,
      imageUrl: `/uploads/sites/${file.filename}`,
      caption: caption || null,
      uploadedById: currentUserId,
    },
    select: {
      id: true,
      siteId: true,
      imageUrl: true,
      caption: true,
      createdAt: true,
      uploadedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return photo;
};