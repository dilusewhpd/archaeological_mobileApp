import bcrypt from "bcrypt";
import { CreateUserInput, GetUsersQuery, UpdateUserInput, UserIdParam } from "../validators/user.validation.js";
import { generateTemporaryPassword } from "../utils/tempPasswordGen.js";
import { prisma } from "../config/prismaDb.js";
import { Prisma } from "@prisma/client";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../errors/customErrors.js";

export const createUser = async (
  data: CreateUserInput
) => {

  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new ConflictError("Email already exists.");
  }

  const role = await prisma.role.findUnique({
    where: {
      name: data.role,
    },
  });

  if (!role) {
    throw new NotFoundError("Role not found.");
  }

  const temporaryPassword =
    generateTemporaryPassword();

  const passwordHash =
    await bcrypt.hash(temporaryPassword, 10);

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      roleId: role.id,
      mustChangePassword: true,
    },

    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,

      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    user,
    temporaryPassword,
  };
};

export const getUsers = async (
  query: GetUsersQuery
) => {
  const {
    page,
    limit,
    search,
    role,
    isActive,
  } = query;

  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

  // Search
  if (search) {
    where.OR = [
      {
        firstName: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        lastName: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        email: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  // Role filter
  if (role) {
    where.role = {
      name: role,
    };
  }

  // Active filter
  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  const [users, totalItems] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    prisma.user.count({
      where,
    }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

export const getUserById = async (
  params: UserIdParam
) => {
  const { id } = params;

  const user = await prisma.user.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
      updatedAt: true,

      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  return user;
};

export const updateUser = async (
  params: UserIdParam,
  data: UpdateUserInput
) => {
  const { id } = params;

  return await prisma.$transaction(async (tx) => {
    // Check whether the user exists
    const existingUser = await tx.user.findUnique({
      where: {
        id,
      },
    });

    if (!existingUser) {
      throw new NotFoundError("User not found.");
    }

    // Check email uniqueness
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await tx.user.findUnique({
        where: {
          email: data.email,
        },
      });

      if (emailExists) {
        throw new ConflictError("Email already exists.");
      }
    }

    let roleId: string | undefined;

    // Validate role
    if (data.role) {
      const role = await tx.role.findUnique({
        where: {
          name: data.role,
        },
      });

      if (!role) {
        throw new NotFoundError("Role not found.");
      }

      roleId = role.id;
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (data.firstName !== undefined) {
      updateData.firstName = data.firstName;
    }

    if (data.lastName !== undefined) {
      updateData.lastName = data.lastName;
    }

    if (data.email !== undefined) {
      updateData.email = data.email;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (roleId) {
      updateData.role = {
        connect: {
          id: roleId,
        },
      };
    }

    const updatedUser = await tx.user.update({
      where: {
        id,
      },

      data: updateData,

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,

        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedUser;
  },
  {
    timeout: 300000, // 5 minutes
  });
};

export const deleteUser = async (
  params: UserIdParam,
  currentUserId: string
) => {
  const { id } = params;

  if (id === currentUserId) {
    throw new BadRequestError("You cannot deactivate your own account.");
  }

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  if (!user.isActive) {
    throw new BadRequestError("User is already deactivated.");
  }

  await prisma.user.update({
    where: { id },
    data: {
      isActive: false,
    },
  });

  return {"message": "User deactivated successfully." };
};

export const resetUserPassword = async (
  params: UserIdParam
) => {
  const { id } = params;

  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  if (!user.isActive) {
    throw new BadRequestError("Cannot reset password for a deactivated user.");
  }

  const temporaryPassword = generateTemporaryPassword();

  const passwordHash = await bcrypt.hash(
    temporaryPassword,
    Number(process.env.BCRYPT_SALT_ROUNDS)
  );

  await prisma.user.update({
    where: {
      id,
    },
    data: {
      passwordHash,
      mustChangePassword: true,
    },
  });

  return {
    temporaryPassword,
  };
};