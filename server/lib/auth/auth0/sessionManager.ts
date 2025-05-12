// sessionManager.ts
import type { Auth0Session } from "./auth0Client";
import type { Context } from "hono";
import { SignJWT, jwtVerify } from "jose";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import env from "../../config/env.ts";
import type { Auth0SessionManager } from "./auth0SessionManager";

const COOKIE_NAME = "auth_session";
const ENCODER = new TextEncoder();

export const sessionManager: Auth0SessionManager = {
  async set(c: Context, session: Auth0Session): Promise<void> {
    const jwt = await new SignJWT(session)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(ENCODER.encode(env.AUTH0_CLIENT_SECRET));

    setCookie(c, COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: env.APPLICATION_STATE === "prod", // Set to true in production with HTTPS
      path: "/",
      maxAge: 3600,
      sameSite: "Lax",
    });
  },

  async get(c: Context): Promise<Auth0Session | null> {
    const token = getCookie(c, COOKIE_NAME);
    if (!token) return null;

    try {
      const { payload } = await jwtVerify(
        token,
        ENCODER.encode(env.AUTH0_CLIENT_SECRET),
        { algorithms: ["HS256"] }
      );
      return payload as Auth0Session;
    } catch (err) {
      return null;
    }
  },

  clear(c: Context): void {
    deleteCookie(c, COOKIE_NAME, {
      path: "/",
    });
  },
};
