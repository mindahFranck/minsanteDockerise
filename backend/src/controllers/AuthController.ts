import type { Response, NextFunction } from "express";
import { body } from "express-validator";
import type { AuthRequest } from "../types";
import { AuthService } from "../services/AuthService";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/User";
import { NotFoundError } from "../utils/ApiError";
import { AuditService } from "../services/AuditService";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - firstName
   *               - lastName
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 minLength: 6
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [user, manager, admin, super_admin]
   *     responses:
   *       201:
   *         description: User registered successfully
   *       400:
   *         description: Validation error
   */
  register = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const result = await this.authService.register(req.body);
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
      });
    }
  );

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *       401:
   *         description: Invalid credentials
   */
  login = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { email, password } = req.body;

      try {
        // Trim email and password to remove leading/trailing spaces
        const result = await this.authService.login(email?.trim(), password?.trim());

        // Log successful login
        await AuditService.logLogin(result.user.id, req);

        res.json({
          success: true,
          message: "Login successful",
          data: result,
        });
      } catch (error: any) {
        // Log failed login attempt
        await AuditService.logLoginFailure(email, req, error.message);
        throw error;
      }
    }
  );

  /**
   * @swagger
   * /auth/refresh:
   *   post:
   *     summary: Refresh access token
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *       401:
   *         description: Invalid refresh token
   */
  refreshToken = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshToken(refreshToken);
      res.json({
        success: true,
        message: "Token refreshed successfully",
        data: result,
      });
    }
  );

  /**
   * @swagger
   * /auth/me:
   *   get:
   *     summary: Get current user profile
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
   *       401:
   *         description: Unauthorized
   */
  getProfile = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const user = await User.findByPk(req.user!.id, {
        attributes: { exclude: ["password"] },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      res.json({
        success: true,
        data: user,
      });
    }
  );

  /**
   * @swagger
   * /auth/password:
   *   put:
   *     summary: Change password
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *               newPassword:
   *                 type: string
   *                 minLength: 6
   *     responses:
   *       200:
   *         description: Password changed successfully
   *       401:
   *         description: Invalid current password
   */
  changePassword = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { currentPassword, newPassword } = req.body;
      const result = await this.authService.changePassword(
        req.user!.id,
        currentPassword,
        newPassword
      );
      res.json({
        success: true,
        message: result.message,
      });
    }
  );

  // Validation rules
  static registerValidation = [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("role")
      .optional()
      .isIn(["user", "manager", "admin", "super_admin"])
      .withMessage("Invalid role"),
  ];

  static loginValidation = [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ];

  static changePasswordValidation = [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ];
}
