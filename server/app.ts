import { Hono } from "hono";
import { openAPISpecs } from "hono-openapi";
import { logger } from "hono/logger";
import { apiReference } from "@scalar/hono-api-reference";
import { authRoute } from "./routes/auth/auth";
import { tenantRoutes } from "./routes/organization/tenant";
import { registrationRoutes } from "./routes/organization/user";
import { tenantUserRoutes } from "./routes/organization/tenantUser";
export const app = new Hono();

app.use("*", logger());

// Global error handler
app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ error: err.message || "Internal Server Error" }, 500);
});

// API routes
const apiRoutes = app
  .route("/auth", authRoute)
  .basePath("/api/v1")
  .route("/tenant", tenantRoutes)
  .route("/tenant", registrationRoutes)
  .route("/tenant/users", tenantUserRoutes)

app.get("/health", (c) => c.text("OK", 200));

// Open API spec
app
  .get(
    "/openapi",
    openAPISpecs(app, {
      documentation: {
        info: {
          title: "Hono API",
          version: "1.0.0",
          description: "Auto-generated API documentation.",
        },
        servers: [
          { url: "http://localhost:3000", description: "Local Server" },
        ],

        // security: [
        //   {
        //     CookieAuth: [],
        //   },
        // ],

        // components: {
        //   securitySchemes: {
        //     CookieAuth: {
        //       type: "apiKey",
        //       in: "cookie",
        //       name: "access_token", // Name of the cookie your app expects
        //     },
        //   },
        // },
      },
    })
  )
  .get(
    "/docs",
    apiReference({
      theme: "saturn",
      spec: { url: "/openapi" },
    })
  );
