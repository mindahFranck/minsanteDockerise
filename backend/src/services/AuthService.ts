import jwt from "jsonwebtoken"
import { User } from "../models/User"
import { UnauthorizedError, ValidationError } from "../utils/ApiError"

export class AuthService {
  async register(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    role?: string
  }) {
    const existingUser = await User.findOne({ where: { email: data.email } })

    if (existingUser) {
      throw new ValidationError("Email already registered")
    }

    const user = await User.create({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || "user",
    })

    const token = this.generateToken(user)
    const refreshToken = this.generateRefreshToken(user)

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
    }
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ where: { email } })

    if (!user || !user.isActive) {
      throw new UnauthorizedError("Invalid credentials")
    }

    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials")
    }

    await user.update({ lastLogin: new Date() })

    const token = this.generateToken(user)
    const refreshToken = this.generateRefreshToken(user)

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
        id: number
      }

      const user = await User.findByPk(decoded.id)

      if (!user || !user.isActive) {
        throw new UnauthorizedError("Invalid refresh token")
      }

      const newToken = this.generateToken(user)
      const newRefreshToken = this.generateRefreshToken(user)

      return {
        token: newToken,
        refreshToken: newRefreshToken,
      }
    } catch (error) {
      throw new UnauthorizedError("Invalid refresh token")
    }
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await User.findByPk(userId)

    if (!user) {
      throw new UnauthorizedError("User not found")
    }

    const isPasswordValid = await user.comparePassword(currentPassword)

    if (!isPasswordValid) {
      throw new UnauthorizedError("Current password is incorrect")
    }

    await user.update({ password: newPassword })

    return { message: "Password changed successfully" }
  }

  private generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      },
    )
  }

  private generateRefreshToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
      },
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
      },
    )
  }

  private sanitizeUser(user: User) {
    const { password, ...userWithoutPassword } = user.toJSON()
    return userWithoutPassword
  }
}
