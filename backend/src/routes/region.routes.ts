import { Router } from "express"
import { RegionController } from "../controllers/RegionController"
import { authenticate, authorize } from "../middleware/auth"
import { validate } from "../middleware/validate"

const router = Router()
const controller = new RegionController()

// Routes publiques pour la carte
router.get("/", controller.getAll)

// Routes pour la carte (avec geom et jointures spatiales)
router.get("/map/all", controller.getAllForMap)
router.get("/map/:id", controller.getByIdForMap)

// Route avec vraie jointure spatiale PostGIS (ST_Within, ST_AsGeoJSON)
router.get("/spatial/:id", controller.getByIdSpatial)

router.get("/:id", controller.getById)
router.post(
  "/",
  authenticate,
  authorize("admin", "super_admin"),
  RegionController.validation,
  validate,
  controller.create,
)
router.put(
  "/:id",
  authenticate,
  authorize("admin", "super_admin"),
  RegionController.validation,
  validate,
  controller.update,
)
router.delete("/:id", authenticate, authorize("super_admin"), controller.delete)

export default router
