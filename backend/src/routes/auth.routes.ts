import { Router } from "express"
import { AuthController } from "../controllers/AuthController"
import { authenticate } from "../middleware/auth"
import { validate } from "../middleware/validate"

const router = Router()
const authController = new AuthController()

router.post("/register", AuthController.registerValidation, validate, authController.register)

router.post("/login", AuthController.loginValidation, validate, authController.login)

router.post("/refresh", authController.refreshToken)

router.get("/me", authenticate, authController.getProfile)

router.put("/password", authenticate, AuthController.changePasswordValidation, validate, authController.changePassword)

export default router
