import { z } from "zod"

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["super_admin", "admin", "manager", "user"]).optional(),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

// Region schemas
export const createRegionSchema = z.object({
  nom: z.string().min(1, "Name is required"),
  population: z.number().int().positive().optional(),
})

export const updateRegionSchema = createRegionSchema.partial()

// Departement schemas
export const createDepartementSchema = z.object({
  nom: z.string().min(1, "Name is required"),
  population: z.number().int().positive().optional(),
  chefLieu: z.string().optional(),
  regionId: z.number().int().positive("Region ID is required"),
})

export const updateDepartementSchema = createDepartementSchema.partial()

// Arrondissement schemas
export const createArrondissementSchema = z.object({
  nom: z.string().min(1, "Name is required"),
  population: z.number().int().positive().optional(),
  zone: z.string().optional(),
  departementId: z.number().int().positive("Departement ID is required"),
})

export const updateArrondissementSchema = createArrondissementSchema.partial()

// District schemas
export const createDistrictSchema = z.object({
  nom: z.string().min(1, "Name is required"),
  responsable: z.string().optional(),
  population: z.number().int().positive().optional(),
  superficie: z.number().positive().optional(),
  sitesDisponibles: z.number().int().nonnegative().optional(),
  sitesTotaux: z.number().int().nonnegative().optional(),
})

export const updateDistrictSchema = createDistrictSchema.partial()

// Airesante schemas
export const createAiresanteSchema = z.object({
  nom: z.string().min(1, "Name is required"),
  responsable: z.string().optional(),
  contact: z.string().optional(),
  districtId: z.number().int().positive("District ID is required"),
})

export const updateAiresanteSchema = createAiresanteSchema.partial()

// FOSA schemas
export const createFosaSchema = z.object({
  nom: z.string().min(1, "Name is required"),
  type: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  capaciteLits: z.number().int().nonnegative().optional(),
  fermeture: z.boolean().optional(),
  situation: z.string().optional(),
  arrondissementId: z.number().int().positive().optional(),
  airesanteId: z.number().int().positive().optional(),
})

export const updateFosaSchema = createFosaSchema.partial()

// Personnel schemas
export const createPersonnelSchema = z.object({
  nom: z.string().min(1, "Name is required"),
  prenom: z.string().min(1, "First name is required"),
  matricule: z.string().min(1, "Registration number is required"),
  grade: z.string().optional(),
  categorieId: z.number().int().positive().optional(),
  fosaId: z.number().int().positive().optional(),
})

export const updatePersonnelSchema = createPersonnelSchema.partial()

// Batiment schemas
export const createBatimentSchema = z.object({
  type: z.string().min(1, "Type is required"),
  etat: z.string().optional(),
  fosaId: z.number().int().positive("FOSA ID is required"),
  degradationId: z.number().int().positive().optional(),
})

export const updateBatimentSchema = createBatimentSchema.partial()

// Service schemas
export const createServiceSchema = z.object({
  nom: z.string().min(1, "Name is required"),
  responsable: z.string().optional(),
  dateCreation: z.string().datetime().optional(),
  batimentId: z.number().int().positive("Building ID is required"),
})

export const updateServiceSchema = createServiceSchema.partial()

// Equipement schemas
export const createEquipementSchema = z.object({
  type: z.string().min(1, "Type is required"),
  dateAcquisition: z.string().datetime().optional(),
  serviceId: z.number().int().positive("Service ID is required"),
})

export const updateEquipementSchema = createEquipementSchema.partial()

// Equipebio schemas
export const createEquipebioSchema = z.object({
  type: z.string().min(1, "Type is required"),
  dateAcquisition: z.string().datetime().optional(),
  fonctionnel: z.boolean().optional(),
  serviceId: z.number().int().positive("Service ID is required"),
})

export const updateEquipebioSchema = createEquipebioSchema.partial()

// Materielroulant schemas
export const createMaterielroulantSchema = z.object({
  numeroChassis: z.string().min(1, "Chassis number is required"),
  annee: z.number().int().min(1900).max(new Date().getFullYear()),
  marque: z.string().optional(),
  modele: z.string().optional(),
  type: z.string().optional(),
  fosaId: z.number().int().positive("FOSA ID is required"),
})

export const updateMaterielroulantSchema = createMaterielroulantSchema.partial()

// Parametre schemas
export const createParametreSchema = z.object({
  nombrePatientsAmbulant: z.number().int().nonnegative().optional(),
  nombrePatientsTotal: z.number().int().nonnegative().optional(),
  listeOperationnelle: z.string().optional(),
  date: z.string().datetime().optional(),
  fosaId: z.number().int().positive("FOSA ID is required"),
})

export const updateParametreSchema = createParametreSchema.partial()

// Query schemas
export const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  sort: z.string().optional(),
  order: z.enum(["ASC", "DESC"]).optional(),
  search: z.string().optional(),
})
