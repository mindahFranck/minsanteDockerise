import { Router } from "express"
import { FosaController } from "../controllers/FosaController"
import { authenticate, authorize } from "../middleware/auth"
import { validate } from "../middleware/validate"
import { upload } from "../middleware/upload"

const router = Router()
const controller = new FosaController()

// Routes publiques pour la carte
router.get("/", controller.getAll)
router.get("/closed", controller.getClosedFosas)
router.get("/type/:type", controller.getByType)

// Routes pour la carte (avec geom et jointures spatiales)
router.get("/map/all", controller.getAllForMap)
router.get("/map/:id", controller.getByIdForMap)
router.get("/map/airesante/:airesanteId", controller.getByAiresanteForMap)

// Routes avec vraies jointures spatiales PostGIS (ST_Within, ST_DWithin, ST_AsGeoJSON)
router.get("/spatial/region/:regionId", controller.getFosasByRegionSpatial)
router.get("/spatial/district/:districtId", controller.getFosasByDistrictSpatial)
router.get("/spatial/airesante/:airesanteId", controller.getFosasByAiresanteSpatial)

router.get("/:id", controller.getById)

router.post(
  "/",
  authenticate,
  authorize("manager", "admin", "super_admin"),
  upload.single("image"),
  FosaController.validation,
  validate,
  controller.create,
)

router.put(
  "/:id",
  authenticate,
  authorize("manager", "admin", "super_admin"),
  upload.single("image"),
  FosaController.validation,
  validate,
  controller.update,
)

router.delete("/:id", authenticate, authorize("admin", "super_admin"), controller.delete)

export default router
