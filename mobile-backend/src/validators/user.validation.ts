import { z } from "zod";
import { ROLES } from "../utils/constants/auth.constants.js";

export const createUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2)
    .max(100),

  lastName: z
    .string()
    .trim()
    .min(2)
    .max(100),

  email: z
    .email()
    .trim()
    .toLowerCase(),

  role: z.enum([
    ROLES.ADMIN,
    ROLES.ANALYST,
    ROLES.FIELD_OFFICER,
    ROLES.SENIOR_OFFICER
  ]),
});

export type CreateUserInput =
  z.infer<typeof createUserSchema>;

  export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  search: z.string().trim().optional(),

  role: z
    .enum([
      ROLES.ADMIN,
      ROLES.ANALYST,
      ROLES.FIELD_OFFICER,
      ROLES.SENIOR_OFFICER,
    ])
    .optional(),

  isActive: z
    .enum(["true", "false"])
    .optional(),
});

export type GetUsersQuery =
  z.infer<typeof getUsersQuerySchema>;

export const userIdParamSchema = z.object({
  id: z.uuid("Invalid user ID."),
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;

export const updateUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  lastName: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  email: z
    .email()
    .trim()
    .toLowerCase()
    .optional(),

  role: z.enum([
    ROLES.ADMIN,
    ROLES.ANALYST,
    ROLES.FIELD_OFFICER,
    ROLES.SENIOR_OFFICER,
  ]).optional(),

  isActive: z.boolean().optional(),
})
.refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided.",
  }
);

export type UpdateUserInput =
  z.infer<typeof updateUserSchema>;