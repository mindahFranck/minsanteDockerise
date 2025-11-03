import request from "supertest"
import app from "../server"
import sequelize from "../config/database"

describe("Authentication Tests", () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        email: "test@example.com",
        password: "Test@123456",
        name: "Test User",
      })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty("token")
      expect(response.body.data.user).toHaveProperty("email", "test@example.com")
    })

    it("should not register user with existing email", async () => {
      await request(app).post("/api/v1/auth/register").send({
        email: "duplicate@example.com",
        password: "Test@123456",
        name: "Test User",
      })

      const response = await request(app).post("/api/v1/auth/register").send({
        email: "duplicate@example.com",
        password: "Test@123456",
        name: "Test User 2",
      })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it("should validate email format", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        email: "invalid-email",
        password: "Test@123456",
        name: "Test User",
      })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/v1/auth/register").send({
        email: "login@example.com",
        password: "Test@123456",
        name: "Login User",
      })
    })

    it("should login with valid credentials", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "login@example.com",
        password: "Test@123456",
      })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty("token")
    })

    it("should not login with invalid password", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "login@example.com",
        password: "WrongPassword",
      })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })
  })
})
