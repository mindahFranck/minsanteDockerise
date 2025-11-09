import type {
  Model,
  ModelStatic,
  FindOptions,
  WhereOptions,
  Transaction,
} from "sequelize";
import { NotFoundError } from "../utils/ApiError";
import {
  BaseRepository,
  type QueryOptions,
} from "../repositories/BaseRepository";
import { CacheService } from "../config/redis";
import { logger } from "../config/logger";

export class BaseService<T extends Model> {
  protected repository: BaseRepository<T>;
  protected cacheTTL = 3600; // 1 hour
  protected cachePrefix: string;

  constructor(protected model: ModelStatic<T>) {
    this.repository = new BaseRepository(model);
    this.cachePrefix = model.name.toLowerCase();
  }

  async findAll(options?: FindOptions): Promise<T[]> {
    const cacheKey = `${this.cachePrefix}:all:${JSON.stringify(options)}`;
    const cached = await CacheService.get<T[]>(cacheKey);

    if (cached) {
      logger.debug(`Cache hit for ${cacheKey}`);
      return cached;
    }

    const data = await this.repository.findAll(options);
    await CacheService.set(cacheKey, data, this.cacheTTL);
    return data;
  }

  async findById(id: number, options?: FindOptions): Promise<T> {
    const cacheKey = `${this.cachePrefix}:${id}`;
    const cached = await CacheService.get<T>(cacheKey);

    if (cached) {
      logger.debug(`Cache hit for ${cacheKey}`);
      return cached as T;
    }

    const record = await this.repository.findById(id, options);
    if (!record) {
      throw new NotFoundError(`${this.model.name} not found`);
    }

    await CacheService.set(cacheKey, record, this.cacheTTL);
    return record;
  }

  async findOne(where: WhereOptions, options?: FindOptions): Promise<T | null> {
    return await this.repository.findOne(where, options);
  }

  async create(data: any, userId?: number): Promise<T> {
    const enrichedData = {
      ...data,
      createdBy: userId,
      updatedBy: userId,
    };

    const record = await this.repository.create(enrichedData);
    await CacheService.delPattern(`${this.cachePrefix}:*`);
    return record;
  }

  async update(id: number, data: any, userId?: number): Promise<T> {
    const enrichedData = {
      ...data,
      updatedBy: userId,
    };

    const [, updated] = await this.repository.update(id, enrichedData);
    if (!updated || updated.length === 0) {
      throw new NotFoundError(`${this.model.name} not found`);
    }

    await CacheService.del(`${this.cachePrefix}:${id}`);
    await CacheService.delPattern(`${this.cachePrefix}:all:*`);
    return updated[0];
  }

  async delete(id: number, soft = true): Promise<{ message: string }> {
    if (soft) {
      await this.repository.softDelete(id);
    } else {
      await this.repository.delete(id);
    }

    await CacheService.del(`${this.cachePrefix}:${id}`);
    await CacheService.delPattern(`${this.cachePrefix}:all:*`);
    return { message: `${this.model.name} deleted successfully` };
  }

  async count(where?: WhereOptions): Promise<number> {
    return await this.repository.count(where);
  }

  async exists(where: WhereOptions): Promise<boolean> {
    return await this.repository.exists(where);
  }

  async findWithQuery(queryOptions: QueryOptions) {
    return await this.repository.findWithQuery(queryOptions);
  }

  async withTransaction<R>(
    callback: (t: Transaction) => Promise<R>
  ): Promise<R> {
    return await this.repository.transaction(callback);
  }

  async bulkCreate(data: any[], userId?: number): Promise<T[]> {
    const enrichedData = data.map((item) => ({
      ...item,
      createdBy: userId,
      updatedBy: userId,
    }));

    const records = await this.repository.bulkCreate(enrichedData);
    await CacheService.delPattern(`${this.cachePrefix}:*`);
    return records;
  }

  async paginate(
    page: number = 1,
    limit?: number,
    options?: FindOptions
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      total: number;
      totalPages: number;
    };
  }> {
    const cacheKey = `${
      this.cachePrefix
    }:paginate:${page}:${limit}:${JSON.stringify(options)}`;
    const cached = await CacheService.get(cacheKey);

    if (cached) {
      logger.debug(`Cache hit for ${cacheKey}`);
      return cached as any;
    }

    // Si limit est undefined, on récupère tout sans pagination
    const queryOptions: any = {
      ...options,
      distinct: true,
    };

    if (limit) {
      const offset = (page - 1) * limit;
      queryOptions.offset = offset;
      queryOptions.limit = limit;
    }

    const { count, rows } = await this.model.findAndCountAll(queryOptions);

    const result = {
      data: rows,
      pagination: {
        page,
        total: count,
        totalPages: limit ? Math.ceil(count / limit) : 1,
      },
    };

    await CacheService.set(cacheKey, result, this.cacheTTL);
    return result;
  }
}
