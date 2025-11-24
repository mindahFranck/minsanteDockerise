import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Health Management System API",
      version: "1.0.0",
      description:
        "Complete API documentation for Health Management System with authentication, CRUD operations, and statistics",
      contact: {
        name: "API Support",
        email: "support@healthmanagement.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api/${
          process.env.API_VERSION || "v1"
        }`,
        description: "Development server",
      },
      {
        url: `https://apiminsante.it-grafik.com/api/${
          process.env.API_VERSION || "v1"
        }`,
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    process.env.NODE_ENV === "production"
      ? "./dist/routes/**/*.js"
      : "./src/routes/**/*.ts",
    process.env.NODE_ENV === "production"
      ? "./dist/controllers/**/*.js"
      : "./src/controllers/**/*.ts",
    process.env.NODE_ENV === "production"
      ? "./dist/models/**/*.js"
      : "./src/models/**/*.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
