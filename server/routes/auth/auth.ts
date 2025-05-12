// routes/authRoute.ts
import { Hono } from "hono";
import { client as auth0Client } from "../../lib/auth/auth0/client";
import { sessionManager } from "../../lib/auth/auth0/sessionManager";

export const authRoute = new Hono()

  // 1. Redirect to Auth0
  .get("/login", (c) => {
    return c.redirect(auth0Client.login());
  })

  // 2. OAuth callback
  .get("/callback", async (c) => {
    try {
      const { user } = await auth0Client.handleCallback(c);
      console.log("Authenticated user:", user);
      return c.redirect("/home"); // or dashboard route
    } catch (err) {
      console.error("Auth0 callback error:", err);
      return c.redirect("/auth/login");
    }
  })

  // 3. Logout
  .get("/logout", (c) => {
    sessionManager.clear(c);
    return c.redirect(auth0Client.logout());
  })

  // 4. Return current user (if logged in)
  .get("/me", async (c) => {
    const user =
      (await auth0Client.silentLogin(c)) || (await auth0Client.refreshToken(c));
    if (!user) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    return c.json({ user });
  });
