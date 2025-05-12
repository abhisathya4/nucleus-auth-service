import { middlewareFactory } from "..";
import { GetRLSToken } from "../../../redis/queries/rlsTokens";

export const getUserRLSToken = middlewareFactory.createMiddleware(
  async (c, next) => {
    try {
      const user = c.var.user;
      if (!user) return c.json({ error: "Unauthorized" }, 401);

      const rls_token = await GetRLSToken(user.id);
      if (!rls_token) return c.json({ error: "Unauthorized" }, 401);

      c.set("rls_token", rls_token);
      await next();
    } catch (e) {
      console.error("[RLS Middleware]", e);
      return c.json({ error: "Unauthorized" }, 401);
    }
  }
);
