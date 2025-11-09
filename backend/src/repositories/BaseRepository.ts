import type {
  Model,
  ModelStatic,
  FindOptions,
  WhereOptions,
  Transaction,
} from "sequelize";
import { Op } from "sequelize";
import sequelize from "../config/database";

export interface QueryOptions {
  page?: number;
  sort?: string;
  order?: "ASC" | "DESC";
  search?: string;
  searchFields?: string[];
  filters?: Record<string, any>;
  include?: any[];
}

export class BaseRepository<T extends Model> {
  constructor(protected model: ModelStatic<T>) {}

  async findAll(options?: FindOptions): Promise<T[]> {
    return await this.model.findAll(options);
  }

  async findById(id: number, options?: FindOptions): Promise<T | null> {
    return await this.model.findByPk(id, options);
  }

  async findOne(where: WhereOptions, options?: FindOptions): Promise<T | null> {
    return await this.model.findOne({ where, ...options });
  }

  async create(data: any, transaction?: Transaction): Promise<T> {
    return await this.model.create(data, { transaction });
  }

  async update(
    id: number,
    data: any,
    transaction?: Transaction
  ): Promise<[number, T[]]> {
    return await this.model.update(data, {
      where: { id } as any,
      returning: true,
      transaction,
    });
  }

  async delete(id: number, transaction?: Transaction): Promise<number> {
    return await this.model.destroy({
      where: { id } as any,
      transaction,
    });
  }

  async softDelete(
    id: number,
    transaction?: Transaction
  ): Promise<[number, T[]]> {
    return await this.model.update({ deletedAt: new Date() } as any, {
      where: { id } as any,
      returning: true,
      transaction,
    });
  }

  async count(where?: WhereOptions): Promise<number> {
    return await this.model.count({ where });
  }

  async exists(where: WhereOptions): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }

  async bulkCreate(data: any[], transaction?: Transaction): Promise<T[]> {
    return await this.model.bulkCreate(data, { transaction });
  }

  async bulkUpdate(data: any[], transaction?: Transaction): Promise<void> {
    await Promise.all(
      data.map((item) =>
        this.model.update(item, {
          where: { id: item.id } as any,
          transaction,
        })
      )
    );
  }

  async findWithQuery(queryOptions: QueryOptions): Promise<{
    data: T[];
    pagination: {
      page: number;
      total: number;
    };
  }> {
    const {
      page = 1,
      sort = "id",
      order = "ASC",
      search,
      searchFields = [],
      filters = {},
      include = [],
    } = queryOptions;

    const where: any = { ...filters };

    // Add search functionality
    if (search && searchFields.length > 0) {
      where[Op.or] = searchFields.map((field) => ({
        [field]: { [Op.like]: `%${search}%` },
      }));
    }

    const { count, rows } = await this.model.findAndCountAll({
      where,
      order: [[sort, order]],
      include,
    });

    return {
      data: rows,
      pagination: {
        page,
        total: count,
      },
    };
  }

  async transaction<R>(callback: (t: Transaction) => Promise<R>): Promise<R> {
    return await sequelize.transaction(callback);
  }
}
