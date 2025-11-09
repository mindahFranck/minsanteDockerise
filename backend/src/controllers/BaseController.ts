import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types";
import type { BaseService } from "../services/BaseService";
import { asyncHandler } from "../utils/asyncHandler";

export class BaseController<T> {
  constructor(protected service: BaseService<any>) {}

  getAll = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const page = Number.parseInt(req.query.page as string) || 1;
      // Permettre de spécifier une limite via query parameter, sinon pas de limite
      const limit = req.query.limit ? Number.parseInt(req.query.limit as string) : undefined;
      const include = req.query.include
        ? JSON.parse(req.query.include as string)
        : undefined;

      const result = await this.service.paginate(page, limit, { include });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    }
  );

  getById = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const id = Number.parseInt(req.params.id);
      const include = req.query.include
        ? JSON.parse(req.query.include as string)
        : undefined;

      const record = await this.service.findById(id, { include });

      res.json({
        success: true,
        data: record,
      });
    }
  );

  create = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const record = await this.service.create(req.body);

      res.status(201).json({
        success: true,
        message: "Resource created successfully",
        data: record,
      });
    }
  );

  update = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const id = Number.parseInt(req.params.id);
      const record = await this.service.update(id, req.body);

      res.json({
        success: true,
        message: "Resource updated successfully",
        data: record,
      });
    }
  );

  delete = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const id = Number.parseInt(req.params.id);
      const result = await this.service.delete(id);

      res.json({
        success: true,
        message: result.message,
      });
    }
  );
}
