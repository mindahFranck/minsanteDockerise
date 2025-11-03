import { BaseService } from "./BaseService"
import { User } from "../models/User"
import bcrypt from "bcryptjs"
import { ConflictError } from "../utils/ApiError"

export class UserService extends BaseService<User> {
  constructor() {
    super(User)
  }

  async create(data: any, userId?: number): Promise<User> {
    // Check if email already exists
    const existingUser = await this.findOne({ email: data.email })
    if (existingUser) {
      throw new ConflictError("Email already exists")
    }

    // Hash password before creating
    if (data.password) {
      const salt = await bcrypt.genSalt(10)
      data.password = await bcrypt.hash(data.password, salt)
    }

    return await super.create(data, userId)
  }

  async update(id: number, data: any, userId?: number): Promise<User> {
    // Check if email is being changed and if it already exists
    if (data.email) {
      const existingUser = await this.findOne({ email: data.email })
      if (existingUser && existingUser.id !== id) {
        throw new ConflictError("Email already exists")
      }
    }

    // Hash password if it's being updated
    if (data.password) {
      const salt = await bcrypt.genSalt(10)
      data.password = await bcrypt.hash(data.password, salt)
    }

    return await super.update(id, data, userId)
  }

  async getUserWithScope(id: number) {
    return await this.findById(id, {
      attributes: { exclude: ["password"] },
      include: [
        { association: "region" },
        { association: "departement" },
        { association: "arrondissement" },
      ],
    })
  }

  async getUsersByRole(role: string) {
    return await this.findAll({
      where: { role },
      attributes: { exclude: ["password"] },
    })
  }

  async getUsersByScope(scopeType: string) {
    return await this.findAll({
      where: { scopeType },
      attributes: { exclude: ["password"] },
    })
  }
}
