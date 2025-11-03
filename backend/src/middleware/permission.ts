import type { Response, NextFunction } from "express"
import type { AuthRequest } from "../types"
import { ForbiddenError, UnauthorizedError } from "../utils/ApiError"
import { User } from "../models/User"
import Permission from "../models/Permission"
import RolePermission from "../models/RolePermission"
import Role from "../models/Role"

/**
 * Vérifie si l'utilisateur a la permission pour effectuer une action sur une ressource
 */
export const checkPermission = (resource: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required")
      }

      const user = await User.findByPk(req.user.id)
      if (!user || !user.isActive) {
        throw new UnauthorizedError("User not found or inactive")
      }

      // Super admin a tous les droits
      if (user.role === "super_admin") {
        return next()
      }

      // TODO: Vérifier les permissions dans la table role_permissions
      // Pour l'instant, utilisons une logique simplifiée basée sur les rôles

      const permissions: Record<string, string[]> = {
        super_admin: ["*"], // Tous les droits
        admin: [
          "users.*",
          "regions.*",
          "departements.*",
          "arrondissements.*",
          "districts.*",
          "airesantes.*",
          "fosas.*",
          "batiments.*",
          "services.*",
          "personnels.*",
          "equipements.*",
          "categories.*",
        ],
        manager: [
          "fosas.read",
          "fosas.update",
          "batiments.read",
          "batiments.create",
          "batiments.update",
          "services.read",
          "services.create",
          "services.update",
          "personnels.*",
          "equipements.*",
        ],
        user: [
          "regions.read",
          "departements.read",
          "arrondissements.read",
          "districts.read",
          "airesantes.read",
          "fosas.read",
          "batiments.read",
          "services.read",
          "personnels.read",
          "equipements.read",
        ],
      }

      const userPermissions = permissions[user.role] || []
      const requiredPermission = `${resource}.${action}`

      const hasPermission = userPermissions.some((perm) => {
        if (perm === "*") return true
        if (perm === requiredPermission) return true
        if (perm.endsWith(".*") && requiredPermission.startsWith(perm.replace(".*", ""))) {
          return true
        }
        return false
      })

      if (!hasPermission) {
        throw new ForbiddenError(`You don't have permission to ${action} ${resource}`)
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Vérifie si l'utilisateur peut accéder aux données d'une région spécifique
 */
export const checkGeographicScope = async (
  user: User,
  resource: string,
  resourceData: any
): Promise<boolean> => {
  // Super admin et admin national ont accès à tout
  if (user.role === "super_admin" || user.scopeType === "national") {
    return true
  }

  // Vérifier le scope géographique en fonction de la ressource
  switch (resource) {
    case "regions":
      if (user.scopeType === "regional") {
        return user.regionId === resourceData.id
      }
      break

    case "departements":
      if (user.scopeType === "regional") {
        return user.regionId === resourceData.regionId
      }
      if (user.scopeType === "departemental") {
        return user.departementId === resourceData.id
      }
      break

    case "arrondissements":
      if (user.scopeType === "regional") {
        // Vérifier si l'arrondissement appartient à un département de la région
        return user.regionId === resourceData.departement?.regionId
      }
      if (user.scopeType === "departemental") {
        return user.departementId === resourceData.departementId
      }
      if (user.scopeType === "arrondissement") {
        return user.arrondissementId === resourceData.id
      }
      break

    case "fosas":
    case "batiments":
    case "services":
    case "personnels":
      // Pour les ressources liées aux FOSA, vérifier via l'arrondissement
      if (user.scopeType === "regional") {
        return user.regionId === resourceData.arrondissement?.departement?.regionId
      }
      if (user.scopeType === "departemental") {
        return user.departementId === resourceData.arrondissement?.departementId
      }
      if (user.scopeType === "arrondissement") {
        return user.arrondissementId === resourceData.arrondissementId
      }
      break
  }

  return false
}

/**
 * Applique les filtres géographiques aux requêtes en fonction du scope de l'utilisateur
 * Retourne un objet avec les filtres à appliquer et les includes nécessaires
 */
export const applyGeographicFilters = (
  user: User,
  resource: string
): { where?: any; include?: any[] } => {
  // Super admin et admin national ont accès à tout
  if (user.role === "super_admin" || user.scopeType === "national") {
    return {}
  }

  const filters: { where?: any; include?: any[] } = {}

  switch (resource) {
    case "regions":
      // Utilisateur régional: voir uniquement sa région
      if (user.scopeType === "regional" && user.regionId) {
        filters.where = { id: user.regionId }
      }
      // Départemental et arrondissement: voir la région parente via département
      if (user.scopeType === "departemental" && user.departementId) {
        // Besoin de joindre avec departements pour filtrer
        filters.include = [
          {
            association: "departements",
            where: { id: user.departementId },
            required: true,
          },
        ]
      }
      if (user.scopeType === "arrondissement" && user.arrondissementId) {
        // Besoin de joindre via departements -> arrondissements
        filters.include = [
          {
            association: "departements",
            required: true,
            include: [
              {
                association: "arrondissements",
                where: { id: user.arrondissementId },
                required: true,
              },
            ],
          },
        ]
      }
      break

    case "departements":
      // Régional: tous les départements de sa région
      if (user.scopeType === "regional" && user.regionId) {
        filters.where = { regionId: user.regionId }
      }
      // Départemental: uniquement son département
      if (user.scopeType === "departemental" && user.departementId) {
        filters.where = { id: user.departementId }
      }
      // Arrondissement: le département parent
      if (user.scopeType === "arrondissement" && user.arrondissementId) {
        filters.include = [
          {
            association: "arrondissements",
            where: { id: user.arrondissementId },
            required: true,
          },
        ]
      }
      break

    case "arrondissements":
      // Régional: tous les arrondissements des départements de sa région
      if (user.scopeType === "regional" && user.regionId) {
        filters.include = [
          {
            association: "departement",
            where: { regionId: user.regionId },
            required: true,
          },
        ]
      }
      // Départemental: tous les arrondissements de son département
      if (user.scopeType === "departemental" && user.departementId) {
        filters.where = { departementId: user.departementId }
      }
      // Arrondissement: uniquement son arrondissement
      if (user.scopeType === "arrondissement" && user.arrondissementId) {
        filters.where = { id: user.arrondissementId }
      }
      break

    case "fosas":
    case "batiments":
    case "services":
    case "personnels":
    case "equipements":
      // Pour toutes ces ressources, on filtre par arrondissement
      // Régional: tous les arrondissements de la région
      if (user.scopeType === "regional" && user.regionId) {
        filters.include = [
          {
            association: "arrondissement",
            required: true,
            include: [
              {
                association: "departement",
                where: { regionId: user.regionId },
                required: true,
              },
            ],
          },
        ]
      }
      // Départemental: tous les arrondissements du département
      if (user.scopeType === "departemental" && user.departementId) {
        filters.include = [
          {
            association: "arrondissement",
            where: { departementId: user.departementId },
            required: true,
          },
        ]
      }
      // Arrondissement: uniquement cet arrondissement
      if (user.scopeType === "arrondissement" && user.arrondissementId) {
        filters.where = { arrondissementId: user.arrondissementId }
      }
      break

    default:
      // Par défaut, appliquer le filtre direct si les champs existent
      if (user.scopeType === "regional" && user.regionId) {
        filters.where = { regionId: user.regionId }
      }
      if (user.scopeType === "departemental" && user.departementId) {
        filters.where = { departementId: user.departementId }
      }
      if (user.scopeType === "arrondissement" && user.arrondissementId) {
        filters.where = { arrondissementId: user.arrondissementId }
      }
  }

  return filters
}
