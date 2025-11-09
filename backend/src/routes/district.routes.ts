import { Router } from "express";
import { DistrictController } from "../controllers/DistrictController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();
const controller = new DistrictController();

router.get("/", controller.getAll);
router.get("/:id", authenticate, controller.getById);
router.post(
  "/",
  authenticate,
  authorize("admin", "super_admin"),
  DistrictController.validation,
  validate,
  controller.create
);
router.put(
  "/:id",
  authenticate,
  authorize("admin", "super_admin"),
  DistrictController.validation,
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
