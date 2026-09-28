import PDFDocument from "pdfkit";
import { prisma } from "../config/prismaDb.js";
import { assessSiteRisk, type RiskLabel } from "./risk.service.js";

/**
 * Palette mirrors the frontend's design system (see the field officer
 * dashboard / SiteDetailView Tailwind colors) so the PDF and the web app
 * read as the same product.
 */
const COLORS = {
  ink: "#3A2A12",
  gold: "#BB892C",
  body: "#3A4048",
  muted: "#5B6472",
  faint: "#8A8478",
  border: "#DEDBD1",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: "#EFEEEA", text: "#5B6472", label: "Draft" },
  PENDING: { bg: "#FBF0EB", text: "#9A5A2E", label: "Pending review" },
  APPROVED: { bg: "#EAF3EA", text: "#2C6B33", label: "Approved" },
  REJECTED: { bg: "#FBEBEA", text: "#B03A2E", label: "Rejected" },
};

const STATUS_ORDER = ["DRAFT", "PENDING", "APPROVED", "REJECTED"] as const;

/** Blue-to-red scale — deliberately distinct from the status colors above, matching frontend/src/lib/risk.ts's RISK_LABEL_COLOR. */
const RISK_STYLES: Record<string, { bg: string; text: string }> = {
  Low: { bg: "#E7EEF3", text: "#2E6B9A" },
  Medium: { bg: "#F6E9DE", text: "#C9722E" },
  High: { bg: "#F3E0DD", text: "#8A2418" },
};
const RISK_ORDER = ["High", "Medium", "Low"] as const;

const PAGE_MARGIN = 50;
const CONTENT_WIDTH = 495.28; // A4 width (595.28) minus left+right margins
const CONTENT_RIGHT = PAGE_MARGIN + CONTENT_WIDTH;

/**
 * The document is created with bottom margin 0 (see buildReportPdf) so
 * pdfkit's own overflow guard never fires while we draw the footer inside
 * the reserved band below CONTENT_BOTTOM — pdfkit auto-inserts a page any
 * time a positioned .text() call lands past its margin boundary, even for
 * absolutely-positioned text that was never meant to flow. CONTENT_BOTTOM is
 * the boundary *we* enforce ourselves in ensureSpace().
 */
const CONTENT_BOTTOM = 841.89 - PAGE_MARGIN;

const formatDate = (date: Date | null | undefined) =>
  date
    ? date.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })
    : "—";

const formatDateTime = (date: Date) =>
  date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ------------------------------------------------------------------ */
/* Generic letterhead / running header / footer                       */
/* ------------------------------------------------------------------ */

function drawLetterhead(
  doc: PDFKit.PDFDocument,
  reportTitle: string,
  subjectLine: string
) {
  let y = PAGE_MARGIN;

  doc
    .font("Times-Bold")
    .fontSize(18)
    .fillColor(COLORS.ink)
    .text("Department of Archaeology", PAGE_MARGIN, y);

  y += 22;
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.gold)
    .text("SRI LANKA  ·  EXPLORATION DATA MANAGEMENT SYSTEM", PAGE_MARGIN, y, {
      characterSpacing: 0.6,
    });

  y += 20;
  doc.moveTo(PAGE_MARGIN, y).lineTo(CONTENT_RIGHT, y).lineWidth(1.5).strokeColor(COLORS.gold).stroke();

  y += 16;
  doc.font("Times-Bold").fontSize(15).fillColor(COLORS.ink).text(reportTitle, PAGE_MARGIN, y);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.faint)
    .text(`Generated ${formatDateTime(new Date())}`, PAGE_MARGIN, y + 2, {
      width: CONTENT_WIDTH,
      align: "right",
    });

  y += 20;
  doc.font("Helvetica").fontSize(9.5).fillColor(COLORS.muted).text(subjectLine, PAGE_MARGIN, y);

  y += 18;
  doc.moveTo(PAGE_MARGIN, y).lineTo(CONTENT_RIGHT, y).lineWidth(0.75).strokeColor(COLORS.border).stroke();

  doc.y = y + 16;
}

function drawRunningHeader(doc: PDFKit.PDFDocument, reportTitle: string) {
  const y = PAGE_MARGIN;
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.ink)
    .text("Department of Archaeology", PAGE_MARGIN, y, { continued: true })
    .font("Helvetica")
    .fillColor(COLORS.faint)
    .text(`  ·  ${reportTitle}`, { continued: false });

  doc
    .moveTo(PAGE_MARGIN, y + 14)
    .lineTo(CONTENT_RIGHT, y + 14)
    .lineWidth(0.75)
    .strokeColor(COLORS.border)
    .stroke();

  doc.y = y + 26;
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number, reportTitle: string) {
  if (doc.y + needed > CONTENT_BOTTOM) {
    doc.addPage();
    drawRunningHeader(doc, reportTitle);
  }
}

function drawFooters(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    const y = doc.page.height - PAGE_MARGIN + 12;
    doc
      .moveTo(PAGE_MARGIN, y - 8)
      .lineTo(CONTENT_RIGHT, y - 8)
      .lineWidth(0.5)
      .strokeColor(COLORS.border)
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.faint)
      .text("Generated by Exploration Data Management System", PAGE_MARGIN, y, {
        width: CONTENT_WIDTH / 2,
        align: "left",
      })
      .text(`Page ${i - range.start + 1} of ${range.count}`, PAGE_MARGIN + CONTENT_WIDTH / 2, y, {
        width: CONTENT_WIDTH / 2,
        align: "right",
      });
  }
}

/* ------------------------------------------------------------------ */
/* Generic summary strip                                               */
/* ------------------------------------------------------------------ */

interface SummaryColumn {
  label: string;
  value: number;
  color: string;
}

function drawSummary(doc: PDFKit.PDFDocument, columns: SummaryColumn[]) {
  const boxHeight = 52;
  const colWidth = CONTENT_WIDTH / columns.length;
  const top = doc.y;

  doc
    .roundedRect(PAGE_MARGIN, top, CONTENT_WIDTH, boxHeight, 4)
    .fillColor("#FAF9F6")
    .fill()
    .roundedRect(PAGE_MARGIN, top, CONTENT_WIDTH, boxHeight, 4)
    .lineWidth(0.75)
    .strokeColor(COLORS.border)
    .stroke();

  columns.forEach((col, i) => {
    const x = PAGE_MARGIN + i * colWidth;

    if (i > 0) {
      doc
        .moveTo(x, top + 10)
        .lineTo(x, top + boxHeight - 10)
        .lineWidth(0.5)
        .strokeColor(COLORS.border)
        .stroke();
    }

    doc
      .font("Times-Bold")
      .fontSize(18)
      .fillColor(col.color)
      .text(String(col.value), x, top + 9, { width: colWidth, align: "center" });

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(COLORS.faint)
      .text(col.label.toUpperCase(), x, top + 33, {
        width: colWidth,
        align: "center",
        characterSpacing: 0.3,
      });
  });

  doc.y = top + boxHeight + 22;
}

/* ------------------------------------------------------------------ */
/* Generic per-record card                                             */
/* ------------------------------------------------------------------ */

interface CardLine {
  text: string;
  color?: string;
  font?: "Helvetica" | "Helvetica-Oblique";
}

interface CardSpec {
  title: string;
  subtitle: string;
  badge: { label: string; bg: string; text: string };
  lines: CardLine[];
}

function drawBadge(
  doc: PDFKit.PDFDocument,
  badge: { label: string; bg: string; text: string },
  rightEdge: number,
  y: number
) {
  doc.font("Helvetica-Bold").fontSize(8.5);
  const textWidth = doc.widthOfString(badge.label);
  const badgeWidth = textWidth + 16;
  const badgeX = rightEdge - badgeWidth;

  doc.roundedRect(badgeX, y, badgeWidth, 16, 3).fillColor(badge.bg).fill();
  doc.fillColor(badge.text).text(badge.label, badgeX, y + 4, { width: badgeWidth, align: "center" });
}

function measureCard(doc: PDFKit.PDFDocument, spec: CardSpec): number {
  let height = 12 + 16 + 6; // padding-top + header row + gap
  const lineWidth = CONTENT_WIDTH - 28;
  for (const line of spec.lines) {
    doc.font(line.font ?? "Helvetica").fontSize(9);
    height += doc.heightOfString(line.text, { width: lineWidth }) + 2;
  }
  height += 12; // padding-bottom
  return height;
}

function drawCard(doc: PDFKit.PDFDocument, spec: CardSpec, cardHeight: number) {
  const top = doc.y;
  const left = PAGE_MARGIN;
  const padX = 14;

  doc
    .roundedRect(left, top, CONTENT_WIDTH, cardHeight, 4)
    .lineWidth(0.75)
    .strokeColor(COLORS.border)
    .stroke();

  doc
    .font("Times-Bold")
    .fontSize(11.5)
    .fillColor(COLORS.ink)
    .text(spec.title, left + padX, top + 12, { width: CONTENT_WIDTH - 28 - 90, ellipsis: true });

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(COLORS.faint)
    .text(spec.subtitle, left + padX, top + 27);

  drawBadge(doc, spec.badge, left + CONTENT_WIDTH - padX, top + 12);

  const lineX = left + padX;
  const lineWidth = CONTENT_WIDTH - padX * 2;
  let y = top + 42;

  for (const line of spec.lines) {
    doc
      .font(line.font ?? "Helvetica")
      .fontSize(9)
      .fillColor(line.color ?? COLORS.body)
      .text(line.text, lineX, y, { width: lineWidth });
    y += doc.heightOfString(line.text, { width: lineWidth }) + 2;
  }

  doc.y = top + cardHeight + 12;
}

function drawEmptyState(doc: PDFKit.PDFDocument, title: string, body: string) {
  const top = doc.y;
  const height = 90;

  doc
    .roundedRect(PAGE_MARGIN, top, CONTENT_WIDTH, height, 4)
    .fillColor("#FAF9F6")
    .fill()
    .roundedRect(PAGE_MARGIN, top, CONTENT_WIDTH, height, 4)
    .lineWidth(0.75)
    .strokeColor(COLORS.border)
    .stroke();

  doc
    .font("Times-Bold")
    .fontSize(12)
    .fillColor(COLORS.ink)
    .text(title, PAGE_MARGIN, top + 30, { width: CONTENT_WIDTH, align: "center" });

  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor(COLORS.muted)
    .text(body, PAGE_MARGIN, top + 50, { width: CONTENT_WIDTH, align: "center" });

  doc.y = top + height + 16;
}

/* ------------------------------------------------------------------ */
/* Orchestrator shared by every report kind                             */
/* ------------------------------------------------------------------ */

interface BuildReportOptions {
  reportTitle: string;
  subjectLine: string;
  summaryColumns: SummaryColumn[];
  cards: CardSpec[];
  emptyTitle: string;
  emptyBody: string;
}

async function buildReportPdf(opts: BuildReportOptions): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: PAGE_MARGIN, bottom: 0, left: PAGE_MARGIN, right: PAGE_MARGIN },
    bufferPages: true,
  });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  drawLetterhead(doc, opts.reportTitle, opts.subjectLine);
  drawSummary(doc, opts.summaryColumns);

  if (opts.cards.length === 0) {
    drawEmptyState(doc, opts.emptyTitle, opts.emptyBody);
  } else {
    opts.cards.forEach((card) => {
      const cardHeight = measureCard(doc, card);
      ensureSpace(doc, cardHeight + 12, opts.reportTitle);
      drawCard(doc, card, cardHeight);
    });
  }

  drawFooters(doc);

  doc.end();
  return done;
}

/* ------------------------------------------------------------------ */
/* Field officer — "Exploration Log"                                   */
/* ------------------------------------------------------------------ */

export const generateMySitesReportPdf = async (userId: string): Promise<Buffer> => {
  const [user, sites] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    }),
    prisma.site.findMany({
      where: { createdById: userId },
      select: {
        siteCode: true,
        name: true,
        status: true,
        province: true,
        district: true,
        historicalPeriod: true,
        siteType: true,
        submittedAt: true,
        approvedAt: true,
        rejectedAt: true,
        rejectionReason: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const counts = sites.reduce<Record<string, number>>((acc, site) => {
    acc[site.status] = (acc[site.status] ?? 0) + 1;
    return acc;
  }, {});

  const summaryColumns: SummaryColumn[] = [
    { label: "Total sites", value: sites.length, color: COLORS.ink },
    ...STATUS_ORDER.map((key) => ({
      label: STATUS_STYLES[key].label,
      value: counts[key] ?? 0,
      color: STATUS_STYLES[key].text,
    })),
  ];

  const cards: CardSpec[] = sites.map((site) => {
    const lines: CardLine[] = [
      { text: `Location: ${site.district} District, ${site.province} Province` },
      {
        text: `Historical period: ${titleCase(site.historicalPeriod)}    ·    Site type: ${titleCase(site.siteType)}`,
      },
      { text: `Submitted: ${formatDate(site.submittedAt)}` },
    ];
    if (site.status === "APPROVED") {
      lines.push({ text: `Approved: ${formatDate(site.approvedAt)}`, color: STATUS_STYLES.APPROVED.text });
    }
    if (site.status === "REJECTED") {
      lines.push({ text: `Rejected: ${formatDate(site.rejectedAt)}`, color: STATUS_STYLES.REJECTED.text });
      lines.push({ text: `Reason: ${site.rejectionReason ?? "—"}` });
    }

    return {
      title: site.name,
      subtitle: site.siteCode,
      badge: STATUS_STYLES[site.status] ?? { bg: "#EFEEEA", text: COLORS.muted, label: site.status },
      lines,
    };
  });

  return buildReportPdf({
    reportTitle: "Exploration Log",
    subjectLine: user
      ? `Prepared for ${user.firstName} ${user.lastName} (${user.email})`
      : "Prepared for this officer",
    summaryColumns,
    cards,
    emptyTitle: "No sites submitted yet",
    emptyBody: "Once you register and submit an exploration site, it will appear in this report.",
  });
};

/* ------------------------------------------------------------------ */
/* Senior officer — "Review Log"                                       */
/* ------------------------------------------------------------------ */

export const generateMyReviewsReportPdf = async (userId: string): Promise<Buffer> => {
  const [user, sites] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    }),
    prisma.site.findMany({
      where: {
        OR: [
          { status: "PENDING" },
          { status: "APPROVED", approvedById: userId },
          { status: "REJECTED", updatedById: userId },
        ],
      },
      select: {
        siteCode: true,
        name: true,
        status: true,
        province: true,
        district: true,
        historicalPeriod: true,
        siteType: true,
        submittedAt: true,
        approvedAt: true,
        rejectedAt: true,
        rejectionReason: true,
        updatedAt: true,
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const pendingCount = sites.filter((s) => s.status === "PENDING").length;
  const approvedCount = sites.filter((s) => s.status === "APPROVED").length;
  const rejectedCount = sites.filter((s) => s.status === "REJECTED").length;

  const summaryColumns: SummaryColumn[] = [
    { label: "Total in report", value: sites.length, color: COLORS.ink },
    { label: "Awaiting review", value: pendingCount, color: STATUS_STYLES.PENDING.text },
    { label: "Approved by you", value: approvedCount, color: STATUS_STYLES.APPROVED.text },
    { label: "Rejected by you", value: rejectedCount, color: STATUS_STYLES.REJECTED.text },
  ];

  const cards: CardSpec[] = sites.map((site) => {
    const lines: CardLine[] = [
      {
        text: `Submitted by: ${site.createdBy ? `${site.createdBy.firstName} ${site.createdBy.lastName}` : "—"}`,
      },
      { text: `Location: ${site.district} District, ${site.province} Province` },
      {
        text: `Historical period: ${titleCase(site.historicalPeriod)}    ·    Site type: ${titleCase(site.siteType)}`,
      },
      { text: `Submitted: ${formatDate(site.submittedAt)}` },
    ];
    if (site.status === "APPROVED") {
      lines.push({ text: `Approved: ${formatDate(site.approvedAt)}`, color: STATUS_STYLES.APPROVED.text });
    }
    if (site.status === "REJECTED") {
      lines.push({ text: `Rejected: ${formatDate(site.rejectedAt)}`, color: STATUS_STYLES.REJECTED.text });
      lines.push({ text: `Reason: ${site.rejectionReason ?? "—"}` });
    }

    return {
      title: site.name,
      subtitle: site.siteCode,
      badge: STATUS_STYLES[site.status] ?? { bg: "#EFEEEA", text: COLORS.muted, label: site.status },
      lines,
    };
  });

  return buildReportPdf({
    reportTitle: "Review Log",
    subjectLine: user
      ? `Prepared for ${user.firstName} ${user.lastName} (${user.email})`
      : "Prepared for this officer",
    summaryColumns,
    cards,
    emptyTitle: "Nothing to review yet",
    emptyBody: "Sites awaiting review, and sites you've approved or rejected, will appear here.",
  });
};

/* ------------------------------------------------------------------ */
/* Analyst — "Risk Assessment Report"                                  */
/* ------------------------------------------------------------------ */

export const generateRiskAssessmentReportPdf = async (userId: string): Promise<Buffer> => {
  const [user, sites] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    }),
    // Risk assessment is only ever meaningful for APPROVED sites — the same
    // business rule enforced by getSiteRiskAssessment (site.service.ts) and
    // shown in the analyst's own risk-assessment page. Scope is system-wide
    // (every approved site, not just this analyst's own), since risk
    // assessment isn't tied to a particular user's submissions.
    prisma.site.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true,
        siteCode: true,
        name: true,
        province: true,
        district: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const assessed = await Promise.all(
    sites.map(async (site) => ({
      site,
      risk: await assessSiteRisk(site.id, Number(site.latitude), Number(site.longitude)),
    }))
  );

  const rank = (label: string) => RISK_ORDER.indexOf(label as (typeof RISK_ORDER)[number]);
  assessed.sort((a, b) => {
    const rankDiff = rank(a.risk.risk_label) - rank(b.risk.risk_label);
    if (rankDiff !== 0) return rankDiff;
    return b.risk.risk_score - a.risk.risk_score;
  });

  const counts = assessed.reduce<Record<string, number>>((acc, { risk }) => {
    acc[risk.risk_label] = (acc[risk.risk_label] ?? 0) + 1;
    return acc;
  }, {});

  const summaryColumns: SummaryColumn[] = [
    { label: "Sites assessed", value: assessed.length, color: COLORS.ink },
    ...RISK_ORDER.map((label) => ({
      label: `${label} risk`,
      value: counts[label] ?? 0,
      color: RISK_STYLES[label].text,
    })),
  ];

  const cards: CardSpec[] = assessed.map(({ site, risk }) => {
    const style = RISK_STYLES[risk.risk_label] ?? { bg: "#EFEEEA", text: COLORS.muted };
    const probPct = (label: RiskLabel) => Math.round((risk.probabilities[label] ?? 0) * 100);

    const lines: CardLine[] = [
      { text: `Location: ${site.district} District, ${site.province} Province` },
      {
        text: `Climate zone: ${titleCase(risk.climate_zone)}    ·    Elevation: ${risk.elevation_m} m    ·    Distance to coast: ${risk.distance_to_coast_km} km`,
      },
      { text: `Risk score: ${risk.risk_score.toFixed(1)}%`, color: style.text },
      {
        text: `Probabilities — Low: ${probPct("Low")}%    Medium: ${probPct("Medium")}%    High: ${probPct("High")}%`,
      },
      { text: risk.model_note, font: "Helvetica-Oblique", color: COLORS.faint },
    ];

    return {
      title: site.name,
      subtitle: site.siteCode,
      badge: { label: `${risk.risk_label} risk`, bg: style.bg, text: style.text },
      lines,
    };
  });

  return buildReportPdf({
    reportTitle: "Risk Assessment Report",
    subjectLine: user
      ? `Prepared for ${user.firstName} ${user.lastName} (${user.email})    ·    System-wide, all approved sites`
      : "System-wide, all approved sites",
    summaryColumns,
    cards,
    emptyTitle: "No approved sites to assess yet",
    emptyBody: "Risk assessment applies only to approved sites — once a site is approved, it will appear here.",
  });
};
