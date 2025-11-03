import { Router } from "express"
import { ArrondissementController } from "../controllers/ArrondissementController"
import { authenticate, authorize } from "../middleware/auth"
import { validate } from "../middleware/validate"

const router = Router()
const controller = new ArrondissementController()

// Routes publiques pour la carte
router.get("/", controller.getAll)
router.get("/:id", controller.getById)
router.post(
  "/",
  authenticate,
  authorize("admin", "super_admin"),
  ArrondissementController.validation,
  validate,
  controller.create,
)
router.put(
  "/:id",
  authenticate,
  authorize("admin", "super_admin"),
  ArrondissementController.validation,
  validate,
  controller.update,
)
router.delete("/:id", authenticate, authorize("super_admin"), controller.delete)

export default router
