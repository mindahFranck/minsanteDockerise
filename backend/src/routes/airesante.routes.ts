import { Router } from "express";
import { AiresanteController } from "../controllers/AiresanteController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();
const controller = new AiresanteController();

router.get("/", controller.getAll);
router.get("/:id", authenticate, controller.getById);
router.post(
  "/",
  authenticate,
  authorize("admin", "super_admin"),
  AiresanteController.validation,
  validate,
  controller.create
);
router.put(
  "/:id",
  authenticate,
  authorize("admin", "super_admin"),
  AiresanteController.validation,
  validate,
  controller.update
);
router.delete(
  "/:id",
  authenticate,
  authorize("super_admin"),
  controller.delete
);

export default router;
