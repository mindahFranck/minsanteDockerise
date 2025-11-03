import Redis from "ioredis"
import { logger } from "./logger"

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number.parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: Number.parseInt(process.env.REDIS_DB || "0"),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
}

export const redis = new Redis(redisConfig)

redis.on("connect", () => {
  logger.info("Redis connected successfully")
})

redis.on("error", (error) => {
  logger.error("Redis connection error:", error)
})

// Cache helper functions
export class CacheService {
  private static readonly DEFAULT_TTL = 3600 // 1 hour

  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  static async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error)
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error)
    }
  }

  static async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error)
    }
  }

  static async clear(): Promise<void> {
    try {
      await redis.flushdb()
    } catch (error) {
      logger.error("Cache clear error:", error)
    }
  }
}
