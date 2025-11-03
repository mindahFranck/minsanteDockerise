import { Router } from "express"
import { StatisticsController } from "../controllers/StatisticsController"
import { authenticate } from "../middleware/auth"

const router = Router()
const controller = new StatisticsController()

router.get("/overview", authenticate, controller.getOverview)
router.get("/fosas", authenticate, controller.getFosaStats)
router.get("/personnel", authenticate, controller.getPersonnelStats)
router.get("/equipment", authenticate, controller.getEquipmentStats)
router.get("/geographic", authenticate, controller.getGeographicStats)
router.get("/buildings", authenticate, controller.getBuildingStats)
router.get("/patients", authenticate, controller.getPatientStats)

export default router
