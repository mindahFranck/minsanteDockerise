import { Router } from "express"
import { PersonnelController } from "../controllers/PersonnelController"
import { authenticate, authorize } from "../middleware/auth"
import { validate } from "../middleware/validate"

const router = Router()
const controller = new PersonnelController()

router.get("/", authenticate, controller.getAll)
router.get("/:id", authenticate, controller.getById)
router.post(
  "/",
  authenticate,
  authorize("manager", "admin", "super_admin"),
  PersonnelController.validation,
  validate,
  controller.create,
)
router.put(
  "/:id",
  authenticate,
  authorize("manager", "admin", "super_admin"),
  PersonnelController.validation,
  validate,
  controller.update,
)
router.delete("/:id", authenticate, authorize("admin", "super_admin"), controller.delete)

export default router
