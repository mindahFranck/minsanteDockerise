import { Router } from "express"
import { ParametreController } from "../controllers/ParametreController"
import { authenticate, authorize } from "../middleware/auth"
import { validate } from "../middleware/validate"

const router = Router()
const controller = new ParametreController()

router.get("/", authenticate, controller.getAll)
router.get("/:id", authenticate, controller.getById)
router.post(
  "/",
  authenticate,
  authorize("super_admin"),
  ParametreController.validation,
  validate,
  controller.create,
)
router.put(
  "/:id",
  authenticate,
  authorize("super_admin"),
  ParametreController.validation,
  validate,
  controller.update,
)
router.delete("/:id", authenticate, authorize("super_admin"), controller.delete)

export default router
