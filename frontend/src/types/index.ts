export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "super_admin" | "admin" | "manager" | "user";
  isActive: boolean;
  lastLogin?: string;
  scopeType?: "national" | "regional" | "departemental" | "arrondissement";
  regionId?: number;
  departementId?: number;
  arrondissementId?: number;
  region?: Region;
  departement?: Departement;
  arrondissement?: Arrondissement;
  createdAt?: string;
  updatedAt?: string;
  // Legacy fields for compatibility
  nom?: string;
  prenom?: string;
  telephone?: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  region: string;
  city: string;
  type: "public" | "private" | "confessional" | "military";
  category: "CHU" | "CHR" | "CHD" | "CMA" | "CSI" | "dispensaire";
  status: "operational" | "maintenance" | "construction" | "closed";
  coordinates: [number, number];
  photos: string[];
  description: string;

  // Capacité et personnel
  capacity: {
    totalBeds: number;
    occupiedBeds: number;
    operatingRooms: number;
    emergencyBeds: number;
  };

  staff: {
    doctors: number;
    nurses: number;
    technicians: number;
    administrative: number;
  };

  // Patrimoine immobilier
  buildings: {
    id: string;
    name: string;
    type: "medical" | "administrative" | "technical" | "accommodation";
    surface: number;
    floors: number;
    yearBuilt: number;
    condition: "excellent" | "good" | "fair" | "poor" | "critical";
    lastRenovation?: string;
  }[];

  // Équipements médicaux
  equipment: {
    category: string;
    items: {
      name: string;
      quantity: number;
      condition: "excellent" | "good" | "fair" | "poor" | "out_of_order";
      lastMaintenance?: string;
      nextMaintenance?: string;
    }[];
  }[];

  // Finances et budget
  budget: {
    annual: number;
    maintenance: number;
    equipment: number;
    personnel: number;
  };

  // Services disponibles
  services: string[];

  // Données de performance
  performance: {
    patientSatisfaction: number;
    occupancyRate: number;
    averageStayDuration: number;
    mortalityRate: number;
  };

  // Maintenance et travaux
  maintenance: {
    lastInspection: string;
    nextInspection: string;
    priority: "low" | "medium" | "high" | "urgent";
    issues: string[];
    plannedWorks: {
      description: string;
      budget: number;
      startDate: string;
      endDate: string;
      status: "planned" | "ongoing" | "completed";
    }[];
  };

  lastUpdate: string;
  createdBy: string;
}

export interface Statistics {
  totalHospitals: number;
  totalBeds: number;
  averageOccupancy: number;
  totalStaff: number;
  budgetTotal: number;
  hospitalsByRegion: {
    region: string;
    count: number;
    beds: number;
  }[];
  hospitalsByType: {
    type: string;
    count: number;
  }[];
  hospitalsByCategory: {
    category: string;
    count: number;
  }[];
  maintenanceAlerts: number;
  equipmentStatus: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    outOfOrder: number;
  };
}

export interface MaintenanceTask {
  id: string;
  hospitalId: string;
  buildingId?: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in-progress" | "completed" | "cancelled";
  assignedTo: string;
  dueDate: string;
  createdAt: string;
  estimatedCost: number;
  actualCost?: number;
  category: "building" | "equipment" | "infrastructure" | "security";
}

export interface Report {
  id: string;
  title: string;
  type: "maintenance" | "financial" | "capacity" | "equipment" | "performance";
  generatedAt: string;
  generatedBy: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  format: "pdf" | "excel" | "csv";
}

export interface Forecast {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  hospitals: string[];
  projections: {
    year: number;
    budget: number;
    capacity: number;
    staff: number;
    maintenance: number;
    equipment: number;
  }[];
  status: "draft" | "active" | "completed";
  createdBy: string;
  createdAt: string;
}

// Types pour les bâtiments (compatibilité avec l'ancien système)
export interface Building {
  id: string;
  name: string;
  address: string;
  type: "residential" | "commercial" | "industrial" | "institutional";
  status: "active" | "maintenance" | "vacant" | "planned";
  coordinates: [number, number];
  surface: number;
  floors: number;
  yearBuilt: number;
  value: number;
  occupancy: {
    rate: number;
    current: number;
    capacity: number;
  };
  energy: {
    rating: string;
    consumption: number;
    emissions: number;
  };
  maintenance: {
    lastInspection?: string;
    nextInspection: string;
    priority: "low" | "medium" | "high";
    issues: string[];
  };
  photos?: string[];
  description?: string;
  lastUpdate: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  buildings: string[];
  projections: {
    year: number;
    value: number;
    maintenance: number;
    occupancy: number;
    energyEfficiency?: number;
  }[];
  status: "draft" | "active" | "completed";
  createdBy: string;
  createdAt: string;
}

// Types pour le système de gestion de santé

export interface Region {
  id: number;
  nom: string;
  capitale?: string;
  population?: number;
  latitude?: number;
  longitude?: number;
  geom?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface Departement {
  id: number;
  departement: string; // Nom du département
  regionId: number;
  region?: Region;
  fit1: number;
  fit2: number;
  fit3: number;
  fit4: number;
  geom?: any;
  createdAt?: string;
  updatedAt?: string;
  // Legacy fields for compatibility
  nom?: string;
  chefLieu?: string;
  population?: number;
  superficie?: number;
}

export interface Arrondissement {
  id: number;
  nom: string;
  departementId: number;
  departement?: Departement;
  population?: number;
  superficie?: number;
  chefLieu?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface District {
  id: number;
  region: string;
  regionId?: number;
  nom_ds?: string;
  code_ds?: number;
  area?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Airesante {
  id: number;
  nom_as: string;
  code_as: string;
  area: number;
  population?: number;
  districtId: number;
  district?: District;
  arrondissementId?: number;
  arrondissement?: Arrondissement;
  createdAt?: string;
  updatedAt?: string;
}
export interface Fosa {
  id: number;
  nom: string;
  type: string;
  capaciteLits: number | null;
  estFerme: boolean;
  situation: string;
  image: string | null;
  arrondissementId: number;
  airesanteId: number;

  // Coordonnées
  longitude?: number;
  latitude?: number;

  // Fréquentation
  nbreVisiteursJour?: number;
  nbrePatientsAmbulants?: number;
  nbrePatientsHospitalises?: number;

  // Ressources Humaines
  nbreMedecinsGeneralistes?: number;
  nbreMedecinsSpecialistes?: number;
  nbreInfirmiersSup?: number;
  nbreInfirmiersDe?: number;
  nbrePersonnelAppui?: number;

  // Infrastructures
  nbreTotalBatiments?: number;
  designationBatiments?: string;
  surfaceTotaleBatie?: number;
  servicesAbrités?: string;
  nbreBatimentsFonctionnels?: number;
  nbreBatimentsAbandonnes?: number;
  etatGeneralLieux?: string;
  nbreLitsOperationnels?: number;
  nbreTotalLitsDisponibles?: number;
  nbreLitsAAjouter?: number;
  nbreBatimentsMaintenanceLourde?: number;
  nbreBatimentsMaintenanceLegere?: number;

  // Budgets
  budgetTravauxNeufsAnneeMoins2?: number;
  budgetTravauxNeufsAnneeMoins1?: number;
  budgetTravauxNeufsAnneeCourante?: number;
  budgetTravauxNeufsAnneePlus1?: number;
  budgetMaintenanceAnneeMoins2?: number;
  budgetMaintenanceAnneeMoins1?: number;
  budgetMaintenanceAnneeCourante?: number;
  budgetMaintenanceAnneePlus1?: number;

  // Autres infrastructures
  connectionElectricite?: boolean;
  connectionEauPotable?: boolean;
  existenceForage?: boolean;
  existenceChateauEau?: boolean;
  existenceEnergieSolaire?: boolean;
  existenceIncinerateur?: boolean;

  // Equipements
  etatGeneralEquipements?: string;
  budgetEquipementsAnneeCourante?: number;
  budgetEquipementsAnneePlus1?: number;
  budgetEquipementsMineursAnneeCourante?: number;
  budgetEquipementsMineursAnneePlus1?: number;

  arrondissement?: Arrondissement;
  airesante?: Airesante;
  createdAt?: string;
  updatedAt?: string;
}

export interface Batiment {
  id: number;
  nom?: string;
  type?: string;
  etat?: string;
  fosaId: number;
  degradationId?: number;
  fosa?: Fosa;
  degradation?: Degradation;
  createdAt?: string;
  updatedAt?: string;
}

export interface Service {
  id: number;
  nom: string;
  responsable?: string;
  dateCreation?: string;
  batimentId?: number;
  fosaId?: number;
  capacite?: number;
  description?: string;
  batiment?: Batiment;
  fosa?: Fosa;
  createdAt?: string;
  updatedAt?: string;
}

export interface Categorie {
  id: number;
  nom: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Personnel {
  id: number;
  nom: string;
  prenom: string;
  matricule?: string;
  grade?: string;
  categorieId?: number;
  categorie?: Categorie;
  fosaId: number;
  fosa?: Fosa;
  createdAt?: string;
  updatedAt?: string;
}

export interface Equipement {
  id: number;
  nom?: string;
  type?: string;
  dateAcquisition?: string;
  serviceId: number;
  service?: Service;
  createdAt?: string;
  updatedAt?: string;
}

export interface Equipebio {
  id: number;
  nom?: string;
  type?: string;
  quantite?: number;
  etat?: string;
  dateAcquisition?: string;
  serviceId: number;
  service?: Service;
  createdAt?: string;
  updatedAt?: string;
}

export interface Materielroulant {
  id: number;
  numeroChassis?: string;
  annee?: number;
  marque?: string;
  modele?: string;
  type?: string;
  dateMiseEnCirculation?: string;
  etat?: string;
  quantite?: number;
  fosaId: number;
  fosa?: Fosa;
  createdAt?: string;
  updatedAt?: string;
}

export interface Degradation {
  id: number;
  type: string;
  description?: string;
  dateConstatation?: string;
  gravite?: string;
  etat?: string;
  coutEstime?: number;
  batimentId?: number;
  batiment?: Batiment;
  equipementId?: number;
  equipement?: Equipement;
  createdAt?: string;
  updatedAt?: string;
}

export interface Parametre {
  id: number;
  cle: string;
  valeur: string;
  type?: string;
  categorie?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
