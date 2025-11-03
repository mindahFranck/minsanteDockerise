import { Router } from "express"
import { HealthController } from "../controllers/HealthController"

const router = Router()

router.get("/", HealthController.check)
router.get("/ready", HealthController.ready)
router.get("/live", HealthController.live)

export default router
