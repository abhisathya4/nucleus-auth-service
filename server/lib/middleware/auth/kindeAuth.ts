import { middlewareFactory } from "..";
import { getTenantUserFromAuthId } from "../../../db/queries/tables/tenantUser";
import { kindeClient, sessionManager } from "../../auth/kinde";
import type { AuthUser } from "../models/AuthUser";

export const getAuthUser = middlewareFactory.createMiddleware(
  async (c, next) => {
    try {
      const manager = sessionManager(c);
      const isAuthenticated = await kindeClient.isAuthenticated(manager);
      if (!isAuthenticated) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      // Kinde User Logic
      const kindeUser = await kindeClient.getUserProfile(manager);

      // Get User Info form database
      const adminInfo: AuthUser = await getTenantUserFromAuthId(kindeUser.id);

      c.set("user", adminInfo);
      await next();
    } catch (e) {
      console.error(e);
      return c.json({ error: "Unauthorized" }, 401);
    }
  }
);
