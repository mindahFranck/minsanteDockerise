import { useAuth } from "../contexts/AuthContext";
import { UserRole } from "../types";

export interface Permissions {
  // Lecture
  canView: boolean;

  // Création
  canCreate: boolean;

  // Modification
  canEdit: boolean;

  // Suppression
  canDelete: boolean;

  // Administration
  canManageUsers: boolean;
  canManageSettings: boolean;
  canImportData: boolean;

  // Permissions géographiques
  canViewAllRegions: boolean;
  canEditAllRegions: boolean;

  // Permissions spécifiques
  canManagePersonnel: boolean;
  canManageEquipments: boolean;
  canManageFosas: boolean;
  canManageBuildings: boolean;
  canManageDegradations: boolean;
}

/**
 * Hook personnalisé pour gérer les permissions basées sur les rôles
 */
export const usePermissions = (): Permissions => {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;
  const scopeType = user?.scopeType;

  // Super Admin a toutes les permissions
  if (role === "super_admin") {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canManageUsers: true,
      canManageSettings: true,
      canImportData: true,
      canViewAllRegions: true,
      canEditAllRegions: true,
      canManagePersonnel: true,
      canManageEquipments: true,
      canManageFosas: true,
      canManageBuildings: true,
      canManageDegradations: true,
    };
  }

  // Admin - Tout faire SAUF suppression
  if (role === "admin") {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false, // Admin NE PEUT PAS supprimer
      canManageUsers: true,
      canManageSettings: true,
      canImportData: true,
      canViewAllRegions: true, // Admin a accès à tout
      canEditAllRegions: true,
      canManagePersonnel: true,
      canManageEquipments: true,
      canManageFosas: true,
      canManageBuildings: true,
      canManageDegradations: true,
    };
  }

  // Manager - LECTURE SEULE uniquement
  if (role === "manager") {
    return {
      canView: true,
      canCreate: false, // Pas de création
      canEdit: false, // Pas de modification
      canDelete: false, // Pas de suppression
      canManageUsers: false,
      canManageSettings: false,
      canImportData: false,
      canViewAllRegions: false, // Pas d'accès géographie
      canEditAllRegions: false,
      canManagePersonnel: false,
      canManageEquipments: false,
      canManageFosas: false,
      canManageBuildings: false,
      canManageDegradations: false,
    };
  }

  // User - LECTURE SEULE uniquement
  return {
    canView: true,
    canCreate: false, // Pas de création
    canEdit: false, // Pas de modification
    canDelete: false, // Pas de suppression
    canManageUsers: false,
    canManageSettings: false,
    canImportData: false,
    canViewAllRegions: false, // Pas d'accès géographie
    canEditAllRegions: false,
    canManagePersonnel: false,
    canManageEquipments: false,
    canManageFosas: false,
    canManageBuildings: false,
    canManageDegradations: false,
  };
};

/**
 * Hook pour vérifier une permission spécifique
 */
export const useHasPermission = (permission: keyof Permissions): boolean => {
  const permissions = usePermissions();
  return permissions[permission];
};

/**
 * Hook pour vérifier plusieurs permissions (AND logique)
 */
export const useHasAllPermissions = (
  requiredPermissions: (keyof Permissions)[]
): boolean => {
  const permissions = usePermissions();
  return requiredPermissions.every((perm) => permissions[perm]);
};

/**
 * Hook pour vérifier si l'utilisateur a au moins une des permissions (OR logique)
 */
export const useHasAnyPermission = (
  requiredPermissions: (keyof Permissions)[]
): boolean => {
  const permissions = usePermissions();
  return requiredPermissions.some((perm) => permissions[perm]);
};
