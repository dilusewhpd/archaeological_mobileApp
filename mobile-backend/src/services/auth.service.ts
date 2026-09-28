import bcrypt from "bcrypt";
import { prisma } from "../config/prismaDb.js";
import { ChangePasswordInput, LoginInput, RegisterInput } from "../validators/auth.validation.js";
import { ROLES } from "../utils/constants/auth.constants.js";
import { generateAccessToken } from "../config/jwt.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/customErrors.js";

export const register = async (data: RegisterInput) => {
    const existingUser = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });

    if (existingUser) {
        throw new ConflictError("Email is already registered.");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const role = await prisma.role.findUnique({
        where: {
            name: ROLES.FIELD_OFFICER,
        },
    });

    if (!role) {
        throw new NotFoundError("Default role not found.");
    }

    const user = await prisma.user.create({
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            passwordHash: hashedPassword,
            roleId: role.id,
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
            createdAt: true,
            role: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    return user;
};

export const login = async (data: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            passwordHash: true,
            isActive: true,
            createdAt: true,
            role: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    if (!user) {
        throw new UnauthorizedError("Invalid email or password.");
    }

    if (!user.isActive) {
        throw new ForbiddenError("Your account has been deactivated. Please contact an administrator.");
    }

    const passwordMatches = await bcrypt.compare(
        data.password,
        user.passwordHash,
    );

    if (!passwordMatches) {
        throw new UnauthorizedError("Invalid email or password.");
    }

    const accessToken = generateAccessToken({
        userId: user.id,
        role: user.role.name,
    });

    const { passwordHash, ...safeUser } = user;

    return {
        user: safeUser,
        accessToken,
    };
};

export const getCurrentUser = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
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

export const changePassword = async (
  currentUserId: string,
  data: ChangePasswordInput
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: currentUserId,
    },
  });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  if (!user.isActive) {
    throw new ForbiddenError("Your account has been deactivated.");
  }

  const isPasswordValid = await bcrypt.compare(
    data.currentPassword,
    user.passwordHash
  );

  if (!isPasswordValid) {
    throw new BadRequestError("Current password is incorrect.");
  }

  const isSamePassword = await bcrypt.compare(
    data.newPassword,
    user.passwordHash
  );

  if (isSamePassword) {
    throw new BadRequestError(
      "New password must be different from the current password."
    );
  }

  const passwordHash = await bcrypt.hash(
    data.newPassword,
    Number(process.env.BCRYPT_SALT_ROUNDS)
  );

  await prisma.user.update({
    where: {
      id: currentUserId,
    },
    data: {
      passwordHash,
      mustChangePassword: false,
    },
  });
};