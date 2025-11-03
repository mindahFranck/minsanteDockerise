import { Router } from "express"
import { CamerounController } from "../controllers/CamerounController"

const router = Router()
const controller = new CamerounController()

// Routes publiques pour la carte
router.get("/", controller.getAll)
router.get("/:id", controller.getById)

export default router
