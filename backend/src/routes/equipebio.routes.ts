import { Router } from "express"
import { EquipebioController } from "../controllers/EquipebioController"
import { authenticate, authorize } from "../middleware/auth"
import { validate } from "../middleware/validate"

const router = Router()
const controller = new EquipebioController()

router.get("/", authenticate, controller.getAll)
router.get("/:id", authenticate, controller.getById)
router.post(
  "/",
  authenticate,
  authorize("manager", "admin", "super_admin"),
  EquipebioController.validation,
  validate,
  controller.create,
)
router.put(
  "/:id",
  authenticate,
  authorize("manager", "admin", "super_admin"),
  EquipebioController.validation,
  validate,
  controller.update,
)
router.delete("/:id", authenticate, authorize("admin", "super_admin"), controller.delete)

export default router
