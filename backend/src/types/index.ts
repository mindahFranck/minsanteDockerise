import type { Request } from "express"

export interface AuthRequest extends Request {
  user?: {
    id: number
    email: string
    role: string
  }
}

export interface PaginationQuery {
  page?: string
  limit?: string
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  MANAGER = "manager",
  USER = "user",
}

export enum FosaType {
  HOSPITAL = "Hôpital",
  HEALTH_CENTER = "Centre de Santé",
  HEALTH_POST = "Poste de Santé",
  CLINIC = "Clinique",
}

export enum BatimentType {
  CONSULTATION = "Consultation",
  HOSPITALIZATION = "Hospitalisation",
  LABORATORY = "Laboratoire",
  PHARMACY = "Pharmacie",
  ADMINISTRATION = "Administration",
}

export enum BatimentState {
  GOOD = "Bon",
  AVERAGE = "Moyen",
  BAD = "Mauvais",
  CRITICAL = "Critique",
}
