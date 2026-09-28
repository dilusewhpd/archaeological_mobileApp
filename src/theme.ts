export const colors = {
  paper: "#F5F2E8",
  surface: "#FFFEFA",
  ink: "#202923",
  muted: "#6E766F",
  line: "#DCDCCF",
  forest: "#25463D",
  forestLight: "#E7EEE8",
  ochre: "#B78333",
  pending: "#9A5A2E",
  approved: "#2C6B33",
  rejected: "#B03A2E",
  draft: "#5B6472",
  dangerBg: "#FBEBEA",
};

export const statusColors = {
  DRAFT: colors.draft,
  PENDING: colors.pending,
  APPROVED: colors.approved,
  REJECTED: colors.rejected,
} as const;