import { Router } from "express";
import { ImportFosaController } from "../controllers/ImportFosaController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
const controller = new ImportFosaController();

// Route pour vider et réimporter les FOSA (TEMPORAIRE - sans auth pour dev)
router.post("/clear-and-import", controller.clearAndImport);

// Route protégée pour production
// router.post(
//   "/clear-and-import",
//   authenticate,
//   authorize("super_admin"),
//   controller.clearAndImport
// );

export default router;
