import { User } from "./User";
import { Region } from "./Region";
import { Departement } from "./Departement";
import { Arrondissement } from "./Arrondissement";
import { Commune } from "./Commune";
import { District } from "./District";
import { Airesante } from "./Airesante";
import { Fosa } from "./Fosa";
import { Cameroun } from "./Cameroun";
import { Degradation } from "./Degradation";
import { Batiment } from "./Batiment";
import { Service } from "./Service";
import { Categorie } from "./Categorie";
import { Personnel } from "./Personnel";
import { Equipement } from "./Equipement";
import { Equipebio } from "./Equipebio";
import { Materielroulant } from "./Materielroulant";
import { Parametre } from "./Parametre";
import Permission from "./Permission";
import Role from "./Role";
import RolePermission from "./RolePermission";
import AuditLog from "./AuditLog";

// Define associations
// Define associations
export const setupAssociations = () => {
  // Region associations
  Region.hasMany(Departement, { foreignKey: "regionId", as: "departements" });
  Region.hasMany(District, { foreignKey: "regionId", as: "districts" });

  // Departement associations
  Departement.belongsTo(Region, { foreignKey: "regionId", as: "region" });
  Departement.hasMany(Arrondissement, {
    foreignKey: "departementId",
    as: "arrondissements",
  });
  Departement.hasMany(Commune, {
    foreignKey: "departementId",
    as: "communes",
  });

  // Arrondissement associations - CHANGED ALIAS
  Arrondissement.belongsTo(Departement, {
    foreignKey: "departementId",
    as: "arrondissementDepartement", // ← Unique alias
  });
  Arrondissement.hasMany(Fosa, { foreignKey: "arrondissementId", as: "fosas" });

  // Commune associations - CHANGED ALIAS
  Commune.belongsTo(Departement, {
    foreignKey: "departementId",
    as: "communeDepartement", // ← Unique alias
  });

  // District associations
  District.belongsTo(Region, { foreignKey: "regionId", as: "regionData" });
  District.hasMany(Airesante, { foreignKey: "districtId", as: "airesantes" });

  // Airesante associations
  Airesante.belongsTo(District, { foreignKey: "districtId", as: "district" });
  Airesante.hasMany(Fosa, { foreignKey: "airesanteId", as: "fosas" });

  // Fosa associations
  Fosa.belongsTo(Arrondissement, {
    foreignKey: "arrondissementId",
    as: "arrondissement",
  });
  Fosa.belongsTo(Airesante, { foreignKey: "airesanteId", as: "airesante" });
  Fosa.hasMany(Batiment, { foreignKey: "fosaId", as: "batiments" });
  Fosa.hasMany(Personnel, { foreignKey: "fosaId", as: "personnels" });
  Fosa.hasMany(Materielroulant, {
    foreignKey: "fosaId",
    as: "materielroulants",
  });
  Fosa.hasMany(Parametre, { foreignKey: "fosaId", as: "parametres" });

  // Degradation associations
  Degradation.hasMany(Batiment, {
    foreignKey: "degradationId",
    as: "batiments",
  });

  // Batiment associations
  Batiment.belongsTo(Fosa, { foreignKey: "fosaId", as: "fosa" });
  Batiment.belongsTo(Degradation, {
    foreignKey: "degradationId",
    as: "degradation",
  });
  Batiment.hasMany(Service, { foreignKey: "batimentId", as: "services" });

  // Service associations
  Service.belongsTo(Batiment, { foreignKey: "batimentId", as: "batiment" });
  Service.hasMany(Equipement, { foreignKey: "serviceId", as: "equipements" });
  Service.hasMany(Equipebio, { foreignKey: "serviceId", as: "equipebios" });

  // Categorie associations
  Categorie.hasMany(Personnel, { foreignKey: "categorieId", as: "personnels" });

  // Personnel associations
  Personnel.belongsTo(Fosa, { foreignKey: "fosaId", as: "fosa" });
  Personnel.belongsTo(Categorie, {
    foreignKey: "categorieId",
    as: "categorie",
  });

  // Equipement associations
  Equipement.belongsTo(Service, { foreignKey: "serviceId", as: "service" });

  // Equipebio associations
  Equipebio.belongsTo(Service, { foreignKey: "serviceId", as: "service" });

  // Materielroulant associations
  Materielroulant.belongsTo(Fosa, { foreignKey: "fosaId", as: "fosa" });

  // Parametre associations
  Parametre.belongsTo(Fosa, { foreignKey: "fosaId", as: "fosa" });

  // User geographic associations
  User.belongsTo(Region, { foreignKey: "regionId", as: "region" });
  User.belongsTo(Departement, {
    foreignKey: "departementId",
    as: "userDepartement",
  }); // ← Also changed this
  User.belongsTo(Arrondissement, {
    foreignKey: "arrondissementId",
    as: "arrondissement",
  });

  // Role-Permission associations (Many-to-Many)
  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: "roleId",
    otherKey: "permissionId",
    as: "permissions",
  });
  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: "permissionId",
    otherKey: "roleId",
    as: "roles",
  });

  // AuditLog associations
  AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" });
};

export {
  User,
  Region,
  Departement,
  Arrondissement,
  Commune,
  District,
  Airesante,
  Fosa,
  Cameroun,
  Degradation,
  Batiment,
  Service,
  Categorie,
  Personnel,
  Equipement,
  Equipebio,
  Materielroulant,
  Parametre,
  Permission,
  Role,
  RolePermission,
  AuditLog,
};
