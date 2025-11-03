import { Router } from "express"
import { UserController } from "../controllers/UserController"
import { authenticate, authorize } from "../middleware/auth"
import { validate } from "../middleware/validate"

const router = Router()
const controller = new UserController()

// All user routes require authentication
// Only super_admin can manage users (controlled in controller)

router.get("/", authenticate, controller.getAll)
router.get("/:id", authenticate, controller.getById)
router.post(
  "/",
  authenticate,
  authorize("super_admin"),
  UserController.createValidation,
  validate,
  controller.create,
)
router.put(
  "/:id",
  authenticate,
  authorize("super_admin"),
  UserController.updateValidation,
  validate,
  controller.update,
)
router.delete("/:id", authenticate, authorize("super_admin"), controller.delete)

export default router
