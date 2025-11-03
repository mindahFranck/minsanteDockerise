import { Hospital, Statistics, MaintenanceTask, User, Forecast } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Dr. Jean-Baptiste Nkomo',
    email: 'admin@minsante.cm',
    role: 'admin',
    department: 'Direction Générale',
    region: 'Centre',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    lastLogin: '2024-02-01T09:30:00Z'
  },
  {
    id: '2',
    name: 'Marie Fotso',
    email: 'agent@minsante.cm',
    role: 'agent',
    department: 'Service Technique',
    region: 'Ouest',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    lastLogin: '2024-02-01T08:15:00Z'
  },
  {
    id: '3',
    name: 'Paul Mbarga',
    email: 'viewer@minsante.cm',
    role: 'viewer',
    department: 'Contrôle de Gestion',
    region: 'Littoral',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    lastLogin: '2024-01-31T16:45:00Z'
  }
];

export const mockHospitals: Hospital[] = [
  {
    id: '1',
    name: 'Centre Hospitalier Universitaire de Yaoundé',
    address: 'Avenue Henri Dunant, Yaoundé',
    region: 'Centre',
    city: 'Yaoundé',
    type: 'public',
    category: 'CHU',
    status: 'operational',
    coordinates: [3.8480, 11.5021],
    photos: [
      'https://images.pexels.com/photos/236380/pexels-photo-236380.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/668298/pexels-photo-668298.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1170979/pexels-photo-1170979.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    description: 'Principal centre hospitalier universitaire du Cameroun, offrant des soins spécialisés et la formation médicale.',
    
    capacity: {
      totalBeds: 800,
      occupiedBeds: 720,
      operatingRooms: 12,
      emergencyBeds: 50
    },
    
    staff: {
      doctors: 120,
      nurses: 350,
      technicians: 80,
      administrative: 150
    },
    
    buildings: [
      {
        id: 'b1',
        name: 'Pavillon Principal',
        type: 'medical',
        surface: 15000,
        floors: 8,
        yearBuilt: 1985,
        condition: 'good',
        lastRenovation: '2018-06-15'
      },
      {
        id: 'b2',
        name: 'Bloc Opératoire',
        type: 'medical',
        surface: 3000,
        floors: 2,
        yearBuilt: 2010,
        condition: 'excellent'
      },
      {
        id: 'b3',
        name: 'Bâtiment Administratif',
        type: 'administrative',
        surface: 2000,
        floors: 3,
        yearBuilt: 1990,
        condition: 'fair'
      }
    ],
    
    equipment: [
      {
        category: 'Imagerie Médicale',
        items: [
          { name: 'Scanner CT', quantity: 2, condition: 'good', lastMaintenance: '2024-01-15', nextMaintenance: '2024-07-15' },
          { name: 'IRM', quantity: 1, condition: 'excellent', lastMaintenance: '2024-01-20', nextMaintenance: '2024-07-20' },
          { name: 'Radiographie', quantity: 8, condition: 'good' }
        ]
      },
      {
        category: 'Équipements Chirurgicaux',
        items: [
          { name: 'Table d\'opération', quantity: 12, condition: 'good' },
          { name: 'Respirateur', quantity: 25, condition: 'fair' },
          { name: 'Moniteur patient', quantity: 50, condition: 'good' }
        ]
      }
    ],
    
    budget: {
      annual: 8500000000,
      maintenance: 850000000,
      equipment: 1700000000,
      personnel: 5100000000
    },
    
    services: [
      'Urgences', 'Chirurgie', 'Médecine Interne', 'Pédiatrie', 'Gynécologie-Obstétrique',
      'Cardiologie', 'Neurologie', 'Oncologie', 'Radiologie', 'Laboratoire'
    ],
    
    performance: {
      patientSatisfaction: 78,
      occupancyRate: 90,
      averageStayDuration: 5.2,
      mortalityRate: 3.1
    },
    
    maintenance: {
      lastInspection: '2024-01-15',
      nextInspection: '2024-07-15',
      priority: 'medium',
      issues: ['Rénovation système électrique', 'Maintenance climatisation'],
      plannedWorks: [
        {
          description: 'Rénovation du pavillon pédiatrique',
          budget: 500000000,
          startDate: '2024-03-01',
          endDate: '2024-08-31',
          status: 'planned'
        }
      ]
    },
    
    lastUpdate: '2024-02-01',
    createdBy: 'Dr. Jean-Baptiste Nkomo'
  },
  
  {
    id: '2',
    name: 'Hôpital Général de Douala',
    address: 'Boulevard de la Liberté, Douala',
    region: 'Littoral',
    city: 'Douala',
    type: 'public',
    category: 'CHR',
    status: 'operational',
    coordinates: [4.0511, 9.7679],
    photos: [
      'https://images.pexels.com/photos/1170979/pexels-photo-1170979.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    description: 'Centre hospitalier régional de référence pour la région du Littoral.',
    
    capacity: {
      totalBeds: 450,
      occupiedBeds: 380,
      operatingRooms: 8,
      emergencyBeds: 30
    },
    
    staff: {
      doctors: 85,
      nurses: 220,
      technicians: 45,
      administrative: 90
    },
    
    buildings: [
      {
        id: 'b4',
        name: 'Bâtiment Principal',
        type: 'medical',
        surface: 8000,
        floors: 5,
        yearBuilt: 1978,
        condition: 'fair',
        lastRenovation: '2015-03-20'
      },
      {
        id: 'b5',
        name: 'Maternité',
        type: 'medical',
        surface: 2500,
        floors: 3,
        yearBuilt: 2005,
        condition: 'good'
      }
    ],
    
    equipment: [
      {
        category: 'Imagerie Médicale',
        items: [
          { name: 'Scanner CT', quantity: 1, condition: 'fair', lastMaintenance: '2023-12-10', nextMaintenance: '2024-06-10' },
          { name: 'Échographe', quantity: 6, condition: 'good' },
          { name: 'Radiographie', quantity: 5, condition: 'good' }
        ]
      }
    ],
    
    budget: {
      annual: 4200000000,
      maintenance: 420000000,
      equipment: 840000000,
      personnel: 2520000000
    },
    
    services: [
      'Urgences', 'Chirurgie', 'Médecine Interne', 'Pédiatrie', 'Gynécologie-Obstétrique',
      'Cardiologie', 'Radiologie', 'Laboratoire'
    ],
    
    performance: {
      patientSatisfaction: 72,
      occupancyRate: 84,
      averageStayDuration: 4.8,
      mortalityRate: 3.5
    },
    
    maintenance: {
      lastInspection: '2024-01-20',
      nextInspection: '2024-07-20',
      priority: 'high',
      issues: ['Réparation toiture', 'Mise aux normes électriques'],
      plannedWorks: [
        {
          description: 'Rénovation du bloc opératoire',
          budget: 300000000,
          startDate: '2024-04-01',
          endDate: '2024-09-30',
          status: 'planned'
        }
      ]
    },
    
    lastUpdate: '2024-01-28',
    createdBy: 'Marie Fotso'
  },
  
  {
    id: '3',
    name: 'Hôpital Provincial de Bafoussam',
    address: 'Quartier Administratif, Bafoussam',
    region: 'Ouest',
    city: 'Bafoussam',
    type: 'public',
    category: 'CHR',
    status: 'operational',
    coordinates: [5.4737, 10.4173],
    photos: [
      'https://images.pexels.com/photos/1170412/pexels-photo-1170412.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    description: 'Hôpital provincial desservant la région de l\'Ouest.',
    
    capacity: {
      totalBeds: 280,
      occupiedBeds: 245,
      operatingRooms: 5,
      emergencyBeds: 20
    },
    
    staff: {
      doctors: 45,
      nurses: 140,
      technicians: 25,
      administrative: 60
    },
    
    buildings: [
      {
        id: 'b6',
        name: 'Pavillon Médical',
        type: 'medical',
        surface: 5000,
        floors: 3,
        yearBuilt: 1982,
        condition: 'fair'
      }
    ],
    
    equipment: [
      {
        category: 'Équipements de Base',
        items: [
          { name: 'Échographe', quantity: 3, condition: 'good' },
          { name: 'Radiographie', quantity: 2, condition: 'fair' }
        ]
      }
    ],
    
    budget: {
      annual: 2100000000,
      maintenance: 210000000,
      equipment: 420000000,
      personnel: 1260000000
    },
    
    services: [
      'Urgences', 'Chirurgie', 'Médecine Interne', 'Pédiatrie', 'Gynécologie-Obstétrique'
    ],
    
    performance: {
      patientSatisfaction: 75,
      occupancyRate: 88,
      averageStayDuration: 4.5,
      mortalityRate: 2.8
    },
    
    maintenance: {
      lastInspection: '2024-01-10',
      nextInspection: '2024-07-10',
      priority: 'medium',
      issues: ['Rénovation plomberie'],
      plannedWorks: []
    },
    
    lastUpdate: '2024-01-25',
    createdBy: 'Paul Mbarga'
  },
  
  {
    id: '4',
    name: 'Hôpital Régional de Garoua',
    address: 'Avenue Ahmadou Ahidjo, Garoua',
    region: 'Nord',
    city: 'Garoua',
    type: 'public',
    category: 'CHR',
    status: 'operational',
    coordinates: [9.3265, 13.3958],
    photos: [
      'https://images.pexels.com/photos/668298/pexels-photo-668298.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    description: 'Centre hospitalier régional du Nord Cameroun.',
    
    capacity: {
      totalBeds: 320,
      occupiedBeds: 280,
      operatingRooms: 6,
      emergencyBeds: 25
    },
    
    staff: {
      doctors: 55,
      nurses: 160,
      technicians: 30,
      administrative: 70
    },
    
    buildings: [
      {
        id: 'b7',
        name: 'Bâtiment Central',
        type: 'medical',
        surface: 6000,
        floors: 4,
        yearBuilt: 1988,
        condition: 'good'
      }
    ],
    
    equipment: [
      {
        category: 'Imagerie',
        items: [
          { name: 'Échographe', quantity: 4, condition: 'good' },
          { name: 'Radiographie', quantity: 3, condition: 'good' }
        ]
      }
    ],
    
    budget: {
      annual: 2800000000,
      maintenance: 280000000,
      equipment: 560000000,
      personnel: 1680000000
    },
    
    services: [
      'Urgences', 'Chirurgie', 'Médecine Interne', 'Pédiatrie', 'Maternité'
    ],
    
    performance: {
      patientSatisfaction: 70,
      occupancyRate: 88,
      averageStayDuration: 5.0,
      mortalityRate: 3.2
    },
    
    maintenance: {
      lastInspection: '2024-01-05',
      nextInspection: '2024-07-05',
      priority: 'low',
      issues: [],
      plannedWorks: []
    },
    
    lastUpdate: '2024-01-30',
    createdBy: 'Dr. Jean-Baptiste Nkomo'
  },
  
  {
    id: '5',
    name: 'Centre Médical d\'Arrondissement de Kribi',
    address: 'Centre-ville, Kribi',
    region: 'Sud',
    city: 'Kribi',
    type: 'public',
    category: 'CMA',
    status: 'operational',
    coordinates: [2.9373, 9.9073],
    photos: [
      'https://images.pexels.com/photos/1170979/pexels-photo-1170979.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    description: 'Centre médical d\'arrondissement desservant la zone côtière du Sud.',
    
    capacity: {
      totalBeds: 80,
      occupiedBeds: 65,
      operatingRooms: 2,
      emergencyBeds: 8
    },
    
    staff: {
      doctors: 12,
      nurses: 35,
      technicians: 8,
      administrative: 15
    },
    
    buildings: [
      {
        id: 'b8',
        name: 'Bâtiment Principal',
        type: 'medical',
        surface: 1500,
        floors: 2,
        yearBuilt: 1995,
        condition: 'good'
      }
    ],
    
    equipment: [
      {
        category: 'Équipements de Base',
        items: [
          { name: 'Échographe', quantity: 1, condition: 'good' },
          { name: 'Radiographie', quantity: 1, condition: 'fair' }
        ]
      }
    ],
    
    budget: {
      annual: 450000000,
      maintenance: 45000000,
      equipment: 90000000,
      personnel: 270000000
    },
    
    services: [
      'Urgences', 'Médecine Générale', 'Pédiatrie', 'Maternité'
    ],
    
    performance: {
      patientSatisfaction: 80,
      occupancyRate: 81,
      averageStayDuration: 3.5,
      mortalityRate: 2.5
    },
    
    maintenance: {
      lastInspection: '2024-01-12',
      nextInspection: '2024-07-12',
      priority: 'low',
      issues: [],
      plannedWorks: []
    },
    
    lastUpdate: '2024-01-22',
    createdBy: 'Marie Fotso'
  },
  
  {
    id: '6',
    name: 'Hôpital de District de Bertoua',
    address: 'Quartier Administratif, Bertoua',
    region: 'Est',
    city: 'Bertoua',
    type: 'public',
    category: 'CHD',
    status: 'maintenance',
    coordinates: [4.5833, 13.6833],
    photos: [
      'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    description: 'Hôpital de district en cours de rénovation.',
    
    capacity: {
      totalBeds: 150,
      occupiedBeds: 90,
      operatingRooms: 3,
      emergencyBeds: 12
    },
    
    staff: {
      doctors: 25,
      nurses: 80,
      technicians: 15,
      administrative: 30
    },
    
    buildings: [
      {
        id: 'b9',
        name: 'Pavillon Principal',
        type: 'medical',
        surface: 3000,
        floors: 2,
        yearBuilt: 1985,
        condition: 'poor'
      }
    ],
    
    equipment: [
      {
        category: 'Équipements de Base',
        items: [
          { name: 'Échographe', quantity: 2, condition: 'fair' },
          { name: 'Radiographie', quantity: 1, condition: 'poor' }
        ]
      }
    ],
    
    budget: {
      annual: 850000000,
      maintenance: 170000000,
      equipment: 170000000,
      personnel: 510000000
    },
    
    services: [
      'Urgences', 'Médecine Générale', 'Chirurgie Mineure', 'Pédiatrie'
    ],
    
    performance: {
      patientSatisfaction: 65,
      occupancyRate: 60,
      averageStayDuration: 4.2,
      mortalityRate: 4.1
    },
    
    maintenance: {
      lastInspection: '2024-01-08',
      nextInspection: '2024-04-08',
      priority: 'urgent',
      issues: ['Rénovation complète nécessaire', 'Problèmes électriques majeurs'],
      plannedWorks: [
        {
          description: 'Rénovation complète de l\'hôpital',
          budget: 800000000,
          startDate: '2024-02-15',
          endDate: '2024-12-31',
          status: 'ongoing'
        }
      ]
    },
    
    lastUpdate: '2024-02-01',
    createdBy: 'Dr. Jean-Baptiste Nkomo'
  }
];

export const mockMaintenanceTasks: MaintenanceTask[] = [
  {
    id: '1',
    hospitalId: '1',
    buildingId: 'b1',
    title: 'Rénovation système électrique CHU Yaoundé',
    description: 'Mise aux normes du système électrique du pavillon principal',
    priority: 'high',
    status: 'in-progress',
    assignedTo: 'Marie Fotso',
    dueDate: '2024-03-15',
    createdAt: '2024-01-20',
    estimatedCost: 150000000,
    category: 'infrastructure'
  },
  {
    id: '2',
    hospitalId: '2',
    title: 'Réparation toiture Hôpital Douala',
    description: 'Réparation urgente de la toiture suite aux infiltrations',
    priority: 'urgent',
    status: 'pending',
    assignedTo: 'Paul Mbarga',
    dueDate: '2024-02-20',
    createdAt: '2024-01-25',
    estimatedCost: 80000000,
    category: 'building'
  },
  {
    id: '3',
    hospitalId: '6',
    title: 'Rénovation complète Hôpital Bertoua',
    description: 'Rénovation complète de l\'infrastructure hospitalière',
    priority: 'urgent',
    status: 'completed',
    assignedTo: 'Dr. Jean-Baptiste Nkomo',
    dueDate: '2024-12-31',
    createdAt: '2024-02-01',
    estimatedCost: 800000000,
    category: 'building'
  }
];

export const mockStatistics: Statistics = {
  totalHospitals: 6,
  totalBeds: 2080,
  averageOccupancy: 82.5,
  totalStaff: 1540,
  budgetTotal: 19400000000,
  hospitalsByRegion: [
    { region: 'Centre', count: 1, beds: 800 },
    { region: 'Littoral', count: 1, beds: 450 },
    { region: 'Ouest', count: 1, beds: 280 },
    { region: 'Nord', count: 1, beds: 320 },
    { region: 'Sud', count: 1, beds: 80 },
    { region: 'Est', count: 1, beds: 150 }
  ],
  hospitalsByType: [
    { type: 'public', count: 6 },
    { type: 'private', count: 0 },
    { type: 'confessional', count: 0 },
    { type: 'military', count: 0 }
  ],
  hospitalsByCategory: [
    { category: 'CHU', count: 1 },
    { category: 'CHR', count: 3 },
    { category: 'CHD', count: 1 },
    { category: 'CMA', count: 1 },
    { category: 'CSI', count: 0 },
    { category: 'dispensaire', count: 0 }
  ],
  maintenanceAlerts: 8,
  equipmentStatus: {
    excellent: 15,
    good: 45,
    fair: 12,
    poor: 3,
    outOfOrder: 2
  }
};

export const mockForecasts: Forecast[] = [
  {
    id: '1',
    name: 'Plan de Modernisation Hospitalière 2024-2029',
    description: 'Programme quinquennal de modernisation des infrastructures hospitalières du Cameroun',
    startDate: '2024-01-01',
    endDate: '2029-12-31',
    hospitals: ['1', '2', '3', '4', '5', '6'],
    projections: [
      { year: 2024, budget: 19400000000, capacity: 2080, staff: 1540, maintenance: 2000000000, equipment: 3000000000 },
      { year: 2025, budget: 22000000000, capacity: 2300, staff: 1700, maintenance: 1800000000, equipment: 3500000000 },
      { year: 2026, budget: 25000000000, capacity: 2500, staff: 1900, maintenance: 1600000000, equipment: 4000000000 },
      { year: 2027, budget: 28000000000, capacity: 2700, staff: 2100, maintenance: 1400000000, equipment: 4500000000 },
      { year: 2028, budget: 31000000000, capacity: 2900, staff: 2300, maintenance: 1200000000, equipment: 5000000000 },
      { year: 2029, budget: 35000000000, capacity: 3200, staff: 2500, maintenance: 1000000000, equipment: 5500000000 }
    ],
    status: 'active',
    createdBy: 'Dr. Jean-Baptiste Nkomo',
    createdAt: '2024-01-01'
  }
];

// Données de compatibilité pour les anciens composants
export const mockBuildings = [];
export const mockScenarios = [];
