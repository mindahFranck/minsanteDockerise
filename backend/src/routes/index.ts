import { Router } from "express"
import authRoutes from "./auth.routes"
import userRoutes from "./user.routes"
import regionRoutes from "./region.routes"
import fosaRoutes from "./fosa.routes"
import statisticsRoutes from "./statistics.routes"
import healthRoutes from "./health.routes"
import departementRoutes from "./departement.routes"
import arrondissementRoutes from "./arrondissement.routes"
import districtRoutes from "./district.routes"
import airesanteRoutes from "./airesante.routes"
import batimentRoutes from "./batiment.routes"
import serviceRoutes from "./service.routes"
import personnelRoutes from "./personnel.routes"
import equipementRoutes from "./equipement.routes"
import equipebioRoutes from "./equipebio.routes"
import materielroulantRoutes from "./materielroulant.routes"
import parametreRoutes from "./parametre.routes"
import categorieRoutes from "./categorie.routes"
import degradationRoutes from "./degradation.routes"
import auditRoutes from "./audit.routes"
import communeRoutes from "./commune.routes"
import camerounRoutes from "./cameroun.routes"

const router = Router()

router.use("/health", healthRoutes)
router.use("/auth", authRoutes)
router.use("/users", userRoutes)
router.use("/regions", regionRoutes)
router.use("/departements", departementRoutes)
router.use("/communes", communeRoutes)
router.use("/cameroun", camerounRoutes)
router.use("/arrondissements", arrondissementRoutes)
router.use("/districts", districtRoutes)
router.use("/airesantes", airesanteRoutes)
router.use("/fosas", fosaRoutes)
router.use("/batiments", batimentRoutes)
router.use("/services", serviceRoutes)
router.use("/personnels", personnelRoutes)
router.use("/equipements", equipementRoutes)
router.use("/equipebios", equipebioRoutes)
router.use("/materielroulants", materielroulantRoutes)
router.use("/parametres", parametreRoutes)
router.use("/categories", categorieRoutes)
router.use("/degradations", degradationRoutes)
router.use("/statistics", statisticsRoutes)
router.use("/audit", auditRoutes)

export default router
