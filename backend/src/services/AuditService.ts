import AuditLog from "../models/AuditLog"
import type { Request } from "express"

export class AuditService {
  /**
   * Enregistre une action dans l'audit log
   */
  static async log(params: {
    userId?: number
    action: string
    resource: string
    resourceId?: number
    details?: any
    req?: Request
    status?: "success" | "failure"
    errorMessage?: string
  }): Promise<void> {
    try {
      const ipAddress = params.req
        ? (params.req.headers["x-forwarded-for"] as string) ||
          (params.req.headers["x-real-ip"] as string) ||
          params.req.socket.remoteAddress
        : undefined

      const userAgent = params.req ? params.req.headers["user-agent"] : undefined

      await AuditLog.create({
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        details: params.details,
        ipAddress,
        userAgent,
        status: params.status || "success",
        errorMessage: params.errorMessage,
      } as any)
    } catch (error) {
      console.error("Failed to log audit:", error)
      // Ne pas faire échouer l'opération si le logging échoue
    }
  }

  /**
   * Enregistre une connexion réussie
   */
  static async logLogin(userId: number, req: Request): Promise<void> {
    await this.log({
      userId,
      action: "login",
      resource: "auth",
      req,
      status: "success",
    })
  }

  /**
   * Enregistre une tentative de connexion échouée
   */
  static async logLoginFailure(email: string, req: Request, error: string): Promise<void> {
    try {
      const ipAddress =
        (req.headers["x-forwarded-for"] as string) ||
        (req.headers["x-real-ip"] as string) ||
        req.socket.remoteAddress

      const userAgent = req.headers["user-agent"]

      await AuditLog.create({
        userId: undefined, // User ID null pour échec de connexion
        action: "login",
        resource: "auth",
        details: { email },
        ipAddress,
        userAgent,
        status: "failure",
        errorMessage: error,
      } as any)
    } catch (err) {
      console.error("Failed to log login failure:", err)
    }
  }

  /**
   * Enregistre la création d'une ressource
   */
  static async logCreate(
    userId: number,
    resource: string,
    resourceId: number,
    data: any,
    req?: Request
  ): Promise<void> {
    await this.log({
      userId,
      action: "create",
      resource,
      resourceId,
      details: { created: data },
      req,
    })
  }

  /**
   * Enregistre la mise à jour d'une ressource
   */
  static async logUpdate(
    userId: number,
    resource: string,
    resourceId: number,
    oldData: any,
    newData: any,
    req?: Request
  ): Promise<void> {
    await this.log({
      userId,
      action: "update",
      resource,
      resourceId,
      details: { before: oldData, after: newData },
      req,
    })
  }

  /**
   * Enregistre la suppression d'une ressource
   */
  static async logDelete(
    userId: number,
    resource: string,
    resourceId: number,
    data: any,
    req?: Request
  ): Promise<void> {
    await this.log({
      userId,
      action: "delete",
      resource,
      resourceId,
      details: { deleted: data },
      req,
    })
  }

  /**
   * Récupère l'historique des actions d'un utilisateur
   */
  static async getUserHistory(
    userId: number,
    options: {
      limit?: number
      offset?: number
      resource?: string
      action?: string
    } = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const where: any = { userId }

    if (options.resource) {
      where.resource = options.resource
    }

    if (options.action) {
      where.action = options.action
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      limit: options.limit || 50,
      offset: options.offset || 0,
      order: [["createdAt", "DESC"]],
    })

    return {
      logs: rows,
      total: count,
    }
  }

  /**
   * Récupère l'historique des actions sur une ressource
   */
  static async getResourceHistory(
    resource: string,
    resourceId: number,
    options: {
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const { count, rows } = await AuditLog.findAndCountAll({
      where: {
        resource,
        resourceId,
      },
      limit: options.limit || 50,
      offset: options.offset || 0,
      order: [["createdAt", "DESC"]],
    })

    return {
      logs: rows,
      total: count,
    }
  }

  /**
   * Récupère toutes les actions récentes (pour admin)
   */
  static async getRecentActivity(
    options: {
      limit?: number
      offset?: number
      resource?: string
      action?: string
      userId?: number
    } = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const where: any = {}

    if (options.resource) {
      where.resource = options.resource
    }

    if (options.action) {
      where.action = options.action
    }

    if (options.userId) {
      where.userId = options.userId
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      limit: options.limit || 100,
      offset: options.offset || 0,
      order: [["createdAt", "DESC"]],
    })

    return {
      logs: rows,
      total: count,
    }
  }
}
