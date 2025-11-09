import { BaseController } from "./BaseController";
import { UserService } from "../services/UserService";
import { body } from "express-validator";
import { asyncHandler } from "../utils/asyncHandler";
import type { AuthRequest } from "../types";
import type { Response, NextFunction } from "express";
import { ForbiddenError } from "../utils/ApiError";
import { AuditService } from "../services/AuditService";

export class UserController extends BaseController<any> {
  private userService: UserService;

  constructor() {
    const service = new UserService();
    super(service);
    this.userService = service;
  }

  /**
   * @swagger
   * /users:
   *   get:
   *     summary: Get all users
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *           enum: [user, manager, admin, super_admin]
   *     responses:
   *       200:
   *         description: List of users
   */
  getAll = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      // Only super_admin and admin can view all users
      if (req.user!.role !== "super_admin" && req.user!.role !== "admin") {
        throw new ForbiddenError("Only administrators can view users");
      }

      const page = Number.parseInt(req.query.page as string) || 1;
      const limit = Number.parseInt(req.query.limit as string) || 100;
      const role = req.query.role as string;

      const options: any = {
        attributes: { exclude: ["password"] },
      };

      if (role) {
        options.where = { role };
      }

      const result = await this.userService.paginate(page, limit, options);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    }
  );

  /**
   * @swagger
   * /users/{id}:
   *   get:
   *     summary: Get user by ID
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: User details
   */
  getById = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;

      // Only super_admin and admin can view other users
      if (
        req.user!.role !== "super_admin" &&
        req.user!.role !== "admin" &&
        req.user!.id !== Number(id)
      ) {
        throw new ForbiddenError("You can only view your own profile");
      }

      const user = await this.userService.findById(Number(id), {
        attributes: { exclude: ["password"] },
      });

      res.json({
        success: true,
        data: user,
      });
    }
  );

  /**
   * @swagger
   * /users:
   *   post:
   *     summary: Create a new user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
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
   *               - role
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [user, manager, admin, super_admin]
   *               scopeType:
   *                 type: string
   *                 enum: [national, regional, departemental, arrondissement]
   *               regionId:
   *                 type: integer
   *               departementId:
   *                 type: integer
   *               arrondissementId:
   *                 type: integer
   *     responses:
   *       201:
   *         description: User created successfully
   */
  create = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      // Only super_admin can create users
      if (req.user!.role !== "super_admin") {
        throw new ForbiddenError("Only super administrators can create users");
      }

      const data = req.body;
      const result = await this.userService.create(data, req.user!.id);

      // Log user creation
      await AuditService.logCreate(
        req.user!.id,
        "users",
        result.id,
        result.toJSON(),
        req
      );

      res.status(201).json({
        success: true,
        data: result,
        message: "User created successfully",
      });
    }
  );

  /**
   * @swagger
   * /users/{id}:
   *   put:
   *     summary: Update a user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: User updated successfully
   */
  update = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;

      // Only super_admin can update users
      if (req.user!.role !== "super_admin") {
        throw new ForbiddenError("Only super administrators can update users");
      }

      // Get old data for audit
      const oldData = await this.userService.findById(Number(id));
      const oldDataJson = oldData.toJSON();

      const data = req.body;
      const result = await this.userService.update(
        Number(id),
        data,
        req.user!.id
      );

      // Log user update
      await AuditService.logUpdate(
        req.user!.id,
        "users",
        Number(id),
        oldDataJson,
        result.toJSON(),
        req
      );

      res.json({
        success: true,
        data: result,
        message: "User updated successfully",
      });
    }
  );

  /**
   * @swagger
   * /users/{id}:
   *   delete:
   *     summary: Delete a user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: User deleted successfully
   */
  delete = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;

      // Only super_admin can delete users
      if (req.user!.role !== "super_admin") {
        throw new ForbiddenError("Only super administrators can delete users");
      }

      // Get user data before deletion for audit
      const userData = await this.userService.findById(Number(id));
      const userDataJson = userData.toJSON();

      await this.userService.delete(Number(id));

      // Log user deletion
      await AuditService.logDelete(
        req.user!.id,
        "users",
        Number(id),
        userDataJson,
        req
      );

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    }
  );

  // Validation rules
  static createValidation = [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("role")
      .isIn(["user", "manager", "admin", "super_admin"])
      .withMessage("Invalid role"),
    body("scopeType")
      .optional()
      .isIn(["national", "regional", "departemental", "arrondissement"])
      .withMessage("Invalid scope type"),
    body("regionId")
      .optional()
      .isInt()
      .withMessage("Region ID must be an integer"),
    body("departementId")
      .optional()
      .isInt()
      .withMessage("Departement ID must be an integer"),
    body("arrondissementId")
      .optional()
      .isInt()
      .withMessage("Arrondissement ID must be an integer"),
  ];

  static updateValidation = [
    body("email").optional().isEmail().withMessage("Valid email is required"),
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("firstName")
      .optional()
      .notEmpty()
      .withMessage("First name cannot be empty"),
    body("lastName")
      .optional()
      .notEmpty()
      .withMessage("Last name cannot be empty"),
    body("role")
      .optional()
      .isIn(["user", "manager", "admin", "super_admin"])
      .withMessage("Invalid role"),
    body("scopeType")
      .optional()
      .isIn(["national", "regional", "departemental", "arrondissement"])
      .withMessage("Invalid scope type"),
    body("regionId")
      .optional()
      .isInt()
      .withMessage("Region ID must be an integer"),
    body("departementId")
      .optional()
      .isInt()
      .withMessage("Departement ID must be an integer"),
    body("arrondissementId")
      .optional()
      .isInt()
      .withMessage("Arrondissement ID must be an integer"),
  ];
}
