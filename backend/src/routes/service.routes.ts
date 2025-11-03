import { Router } from "express"
import { ServiceController } from "../controllers/ServiceController"
import { authenticate, authorize } from "../middleware/auth"
import { validate } from "../middleware/validate"

const router = Router()
const controller = new ServiceController()

router.get("/", authenticate, controller.getAll)
router.get("/:id", authenticate, controller.getById)
router.post(
  "/",
  authenticate,
  authorize("manager", "admin", "super_admin"),
  ServiceController.validation,
  validate,
  controller.create,
)
router.put(
  "/:id",
  authenticate,
  authorize("manager", "admin", "super_admin"),
  ServiceController.validation,
  validate,
  controller.update,
)
router.delete("/:id", authenticate, authorize("admin", "super_admin"), controller.delete)

export default router
