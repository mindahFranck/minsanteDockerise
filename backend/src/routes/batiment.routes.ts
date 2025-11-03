import { Router } from "express"
import { BatimentController } from "../controllers/BatimentController"
import { authenticate, authorize } from "../middleware/auth"
import { validate } from "../middleware/validate"

const router = Router()
const controller = new BatimentController()

router.get("/", authenticate, controller.getAll)
router.get("/:id", authenticate, controller.getById)
router.post(
  "/",
  authenticate,
  authorize("manager", "admin", "super_admin"),
  BatimentController.validation,
  validate,
  controller.create,
)
router.put(
  "/:id",
  authenticate,
  authorize("manager", "admin", "super_admin"),
  BatimentController.validation,
  validate,
  controller.update,
)
router.delete("/:id", authenticate, authorize("admin", "super_admin"), controller.delete)

export default router
