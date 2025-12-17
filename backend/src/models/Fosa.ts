import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";

export class Fosa extends Model {
  public id!: number;
  public nom!: string;
  public type?: string;
  public capaciteLits?: number;
  public estFerme?: boolean;
  public situation?: string;
  public image?: string;
  public arrondissementId!: number;
  public airesanteId!: number;

  // Nouveaux champs (Page 4 du document)
  public orgUnit?: string; // Nom de la FOSA ou centre de formation
  public fonction?: boolean; // Fonctionnel (oui/non)
  public statutRec?: string; // Statut de la FOSA (formation sanitaire/centre de formation)
  public catRec?: string; // Catégorie de la FOSA
  public nomDirect?: string; // Nom du directeur

  // Champs de maintenance
  public lastInspection?: Date; // Date de la dernière inspection
  public nextInspection?: Date; // Date de la prochaine inspection
  public maintenancePriority?: 'low' | 'medium' | 'high' | 'urgent'; // Priorité de maintenance
  public maintenanceIssues?: string; // Problèmes de maintenance (JSON)

  // Champs de contacts
  public telephone?: string; // Téléphone principal
  public email?: string; // Email de contact
  public responsableNom?: string; // Nom du responsable
  public responsableTelephone?: string; // Téléphone du responsable

  // Coordonnées
  public longitude?: number;
  public latitude?: number;

  // Géométrie spatiale (POINT)
  public geom?: any;

  // Questions OUI/NON
  public aCloture?: boolean;
  public aTitreFoncier?: boolean;
  public connecteeElectricite?: boolean;
  public typeCourant?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Relations (counts calculés via includes)
  public readonly arrondissement?: any;
  public readonly airesante?: any;
  public readonly batiments?: any[];
  public readonly vehicules?: any[];
  public readonly equipements?: any[];
  public readonly personnels?: any[];
}

Fosa.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nom: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    capaciteLits: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "capacite_lits",
    },
    estFerme: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: "est_ferme",
    },
    situation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    // Nouveaux champs
    orgUnit: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "org_unit",
    },
    fonction: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    statutRec: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "statut_rec",
    },
    catRec: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "cat_rec",
    },
    nom_directeur: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "nom_directeur",
    },
    arrondissementId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "arrondissement_id",
    },
    airesanteId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "airesante_id",
    },
    // Coordonnées
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    // Géométrie spatiale (POINT)
    geom: {
      type: DataTypes.GEOMETRY("POINT", 4326),
      allowNull: false,
    },
    // Questions OUI/NON
    aCloture: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "a_cloture",
    },
    aTitreFoncier: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "a_titre_foncier",
    },
    connecteeElectricite: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "connectee_electricite",
    },
    typeCourant: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "type_courant",
    },
    // Champs de maintenance
    lastInspection: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_inspection",
    },
    nextInspection: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "next_inspection",
    },
    maintenancePriority: {
      type: DataTypes.ENUM("low", "medium", "high", "urgent"),
      allowNull: true,
      defaultValue: "low",
      field: "maintenance_priority",
    },
    maintenanceIssues: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "maintenance_issues",
    },
    // Champs de contacts
    telephone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    responsableNom: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "responsable_nom",
    },
    responsableTelephone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "responsable_telephone",
    },
  },
  {
    sequelize,
    tableName: "tmpfosa",
    timestamps: true,
  }
);

export default Fosa;
