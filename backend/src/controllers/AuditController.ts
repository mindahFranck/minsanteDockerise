import type { Response, NextFunction } from "express"
import type { AuthRequest } from "../types"
import { AuditService } from "../services/AuditService"
import { asyncHandler } from "../utils/asyncHandler"
import { ForbiddenError } from "../utils/ApiError"

export class AuditController {
  /**
   * Récupère l'historique des actions d'un utilisateur
   */
  getUserHistory = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = Number.parseInt(req.params.userId)
    const page = Number.parseInt(req.query.page as string) || 1
    const limit = Number.parseInt(req.query.limit as string) || 50
    const offset = (page - 1) * limit

    // Vérifier que l'utilisateur est admin ou consulte son propre historique
    if (req.user!.role !== "super_admin" && req.user!.role !== "admin" && req.user!.id !== userId) {
      throw new ForbiddenError("You can only view your own history")
    }

    const { logs, total } = await AuditService.getUserHistory(userId, {
      limit,
      offset,
      resource: req.query.resource as string,
      action: req.query.action as string,
    })

    res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  })

  /**
   * Récupère l'historique des actions sur une ressource
   */
  getResourceHistory = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Seuls les admins peuvent voir l'historique des ressources
    if (req.user!.role !== "super_admin" && req.user!.role !== "admin") {
      throw new ForbiddenError("Only administrators can view resource history")
    }

    const resource = req.params.resource
    const resourceId = Number.parseInt(req.params.resourceId)
    const page = Number.parseInt(req.query.page as string) || 1
    const limit = Number.parseInt(req.query.limit as string) || 50
    const offset = (page - 1) * limit

    const { logs, total } = await AuditService.getResourceHistory(resource, resourceId, {
      limit,
      offset,
    })

    res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  })

  /**
   * Récupère toutes les actions récentes (pour admin)
   */
  getRecentActivity = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Seuls les admins peuvent voir toutes les activités
    if (req.user!.role !== "super_admin" && req.user!.role !== "admin") {
      throw new ForbiddenError("Only administrators can view all activity")
    }

    const page = Number.parseInt(req.query.page as string) || 1
    const limit = Number.parseInt(req.query.limit as string) || 100
    const offset = (page - 1) * limit

    const { logs, total } = await AuditService.getRecentActivity({
      limit,
      offset,
      resource: req.query.resource as string,
      action: req.query.action as string,
      userId: req.query.userId ? Number.parseInt(req.query.userId as string) : undefined,
    })

    res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  })

  /**
   * Récupère les statistiques d'audit
   */
  getAuditStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Seuls les admins peuvent voir les statistiques
    if (req.user!.role !== "super_admin" && req.user!.role !== "admin") {
      throw new ForbiddenError("Only administrators can view audit statistics")
    }

    // TODO: Implémenter des statistiques agrégées
    res.json({
      success: true,
      data: {
        message: "Statistics feature coming soon",
      },
    })
  })
}
