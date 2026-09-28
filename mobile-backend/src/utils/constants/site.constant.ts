import { Prisma } from "@prisma/client";

export const siteDetailsSelect =
  Prisma.validator<Prisma.SiteSelect>()({
    id: true,
    siteCode: true,
    name: true,
    description: true,

    province: true,
    district: true,
    divisionalSecretariat: true,

    latitude: true,
    longitude: true,

    historicalPeriod: true,
    siteType: true,

    landUse: true,
    terrain: true,

    distanceToRiver: true,
    rainfall: true,
    proximityToDevelopment: true,

    status: true,

    submittedAt: true,
    approvedAt: true,
    rejectedAt: true,
    rejectionReason: true,

    createdAt: true,
    updatedAt: true,

    createdBy: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    },

    approvedBy: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    },

    updatedBy: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    },

    photos: {
      select: {
        id: true,
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
      orderBy: {
        createdAt: "desc",
      },
    },
  });