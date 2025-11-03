import { Router } from "express"
import { CategorieController } from "../controllers/CategorieController"
import { authenticate, authorize } from "../middleware/auth"
import { validate } from "../middleware/validate"

const router = Router()
const controller = new CategorieController()

router.get("/", authenticate, controller.getAll)
router.get("/:id", authenticate, controller.getById)
router.post(
  "/",
  authenticate,
  authorize("admin", "super_admin"),
  CategorieController.validation,
  validate,
  controller.create,
)
router.put(
  "/:id",
  authenticate,
  authorize("admin", "super_admin"),
  CategorieController.validation,
  validate,
  controller.update,
)
router.delete("/:id", authenticate, authorize("super_admin"), controller.delete)

export default router
