import { Request, Response, NextFunction } from "express";
import { CreateSiteData, GetSitesQuery, RejectSiteData, SiteIdParam, UpdateSiteData } from "../moduleTypes/sites/sites.types.js";
import { approveSite, createSite, getSiteById, getSiteDashboard, getSiteRiskAssessment, getSites, getSiteWorkflowHistory, rejectSite, submitSite, updateSite, uploadSitePhoto } from "../services/site.service.js";
import { ROLES } from "../utils/constants/auth.constants.js";
import { BadRequestError } from "../errors/customErrors.js";

export const createSiteController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body as CreateSiteData;

    const site = await createSite(
      data,
      req.user!.userId
    );

    return res.status(201).json({
      success: true,
      message: "Site created successfully.",
      data: site,
    });
  } catch (error) {
    next(error);
  }
};

export const getSitesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sites = await getSites(
      req.query as GetSitesQuery
    );

    return res.status(200).json({
      success: true,
      message: "Sites retrieved successfully.",
      ...sites,
    });
  } catch (error) {
    next(error);
  }
};


export const getSiteByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.validatedParams as SiteIdParam;

    const site = await getSiteById(id);

    return res.status(200).json({
      success: true,
      message: "Site retrieved successfully.",
      data: site,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSiteController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.validatedParams as SiteIdParam;

    const data = req.body as UpdateSiteData;

    const site = await updateSite(
      id,
      data,
      req.user!.userId,
      req.user!.role
    );

    return res.status(200).json({
      success: true,
      message: "Site updated successfully.",
      data: site,
    });
  } catch (error) {
    next(error);
  }
};

export const submitSiteController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.validatedParams as SiteIdParam;

    const site = await submitSite(
      id,
      req.user!.userId,
      req.user!.role
    );

    return res.status(200).json({
      success: true,
      message: "Site submitted successfully.",
      data: site,
    });
  } catch (error) {
    next(error);
  }
};

export const approveSiteController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.validatedParams as SiteIdParam;

    const site = await approveSite(
      id,
      req.user!.userId
    );

    return res.status(200).json({
      success: true,
      message: "Site approved successfully.",
      data: site,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectSiteController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.validatedParams as SiteIdParam;

    const data = req.body as RejectSiteData;

    const site = await rejectSite(
      id,
      data,
      req.user!.userId
    );

    return res.status(200).json({
      success: true,
      message: "Site rejected successfully.",
      data: site,
    });
  } catch (error) {
    next(error);
  }
};

export const getMySitesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getSites(
      req.query as GetSitesQuery,
      req.user!.userId
    );

    return res.status(200).json({
      success: true,
      message: "My sites retrieved successfully.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSiteDashboardController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const isFieldOfficer =
      req.user!.role === ROLES.FIELD_OFFICER;

    const dashboard = await getSiteDashboard(
      isFieldOfficer ? req.user!.userId : undefined
    );

    return res.status(200).json({
      success: true,
      message: "Dashboard retrieved successfully.",
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

export const getSiteWorkflowHistoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.validatedParams as SiteIdParam;

    const history = await getSiteWorkflowHistory(
      id,
      req.user!.userId,
      req.user!.role
    );

    return res.status(200).json({
      success: true,
      message: "Workflow history retrieved successfully.",
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

export const getSiteRiskController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.validatedParams as SiteIdParam;

    const risk = await getSiteRiskAssessment(id);

    return res.status(200).json({
      success: true,
      message: "Risk assessment retrieved successfully.",
      data: risk,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadSitePhotoController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.validatedParams as SiteIdParam;

    if (!req.file) {
      throw new BadRequestError("No photo file uploaded.");
    }

    const caption = typeof req.body?.caption === "string" ? req.body.caption : undefined;

    const photo = await uploadSitePhoto(
      id,
      req.file,
      caption,
      req.user!.userId,
      req.user!.role
    );

    return res.status(201).json({
      success: true,
      message: "Photo uploaded successfully.",
      data: photo,
    });
  } catch (error) {
    next(error);
  }
};