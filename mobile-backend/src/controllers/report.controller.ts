import { Request, Response, NextFunction } from "express";
import {
  generateMySitesReportPdf,
  generateMyReviewsReportPdf,
  generateRiskAssessmentReportPdf,
} from "../services/report.service.js";

function sendPdf(res: Response, buffer: Buffer, filenamePrefix: string) {
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filenamePrefix}-${date}.pdf"`);
  res.status(200).send(buffer);
}

export const getMySitesReportController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pdfBuffer = await generateMySitesReportPdf(req.user!.userId);
    sendPdf(res, pdfBuffer, "exploration-log");
  } catch (error) {
    next(error);
  }
};

export const getMyReviewsReportController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pdfBuffer = await generateMyReviewsReportPdf(req.user!.userId);
    sendPdf(res, pdfBuffer, "review-log");
  } catch (error) {
    next(error);
  }
};

export const getRiskAssessmentReportController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pdfBuffer = await generateRiskAssessmentReportPdf(req.user!.userId);
    sendPdf(res, pdfBuffer, "risk-assessment-report");
  } catch (error) {
    next(error);
  }
};
