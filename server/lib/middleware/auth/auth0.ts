// middleware/getAuthUser.ts
import { middlewareFactory } from "..";
import { client as auth0Client } from "../../auth/auth0/client";
import {
  getTenantUserFromAuthId,
  getTenantUserFromEmail,
  updateTenantUserAuthId,
} from "../../../db/queries/tables/tenantUser";
import type { AuthUser } from "../models/AuthUser";

export const getAuthUser = middlewareFactory.createMiddleware(
  async (c, next) => {
    try {
      // Attempt silent login first
      let user = await auth0Client.silentLogin(c);

      // If not found, try refresh
      if (!user) {
        user = await auth0Client.refreshToken(c);
      }

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Fetch your internal user from the DB
      let adminInfo: AuthUser | null = await getTenantUserFromAuthId(user.sub);

      if (!adminInfo) {
        adminInfo = await getTenantUserFromEmail(user.email!);
        if (adminInfo) {
          await updateTenantUserAuthId(adminInfo.id, user.sub);
        }
      }

      if (!adminInfo) {
        return c.json({ error: "User not registered" }, 403);
      }

      c.set("user", adminInfo);
      await next();
    } catch (e) {
      console.error("[Auth Middleware]", e);
      return c.json({ error: "Unauthorized" }, 401);
    }
  }
);
