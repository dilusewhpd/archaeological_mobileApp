export const ROLES = {
  ADMIN: "ADMIN",
  ANALYST: "ANALYST",
  FIELD_OFFICER: "FIELD_OFFICER",
  SENIOR_OFFICER: "SENIOR_OFFICER",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];