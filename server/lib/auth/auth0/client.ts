// client.ts
import type { Context } from "hono";

import env from "../../config/env.ts";
import type { Auth0Client, Auth0User } from "./auth0Client";
import { sessionManager } from "./sessionManager.ts";
import { SaveRLSToken } from "../../../redis/queries/rlsTokens.ts";
import { getTenantUserFromAuthId } from "../../../db/queries/tables/tenantUser.ts";
import type { selectTenantUserSchema } from "../../../db/schema/tenantUser.ts";

export interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  [key: string]: any;
}

const {
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET,
  AUTH0_AUDIENCE,
  AUTH0_DOMAIN,
  AUTH0_REDIRECT_URI,
  AUTH0_RETURN_TO_URL,
} = env;

export const client: Auth0Client = {
  login(redirectPath = AUTH0_REDIRECT_URI) {
    const url = new URL(`https://${AUTH0_DOMAIN}/authorize`);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", AUTH0_CLIENT_ID);
    url.searchParams.set("redirect_uri", redirectPath);
    url.searchParams.set("scope", "openid profile email offline_access");
    if (AUTH0_AUDIENCE) url.searchParams.set("audience", AUTH0_AUDIENCE);
    return url.toString();
  },

  logout(returnTo = AUTH0_RETURN_TO_URL) {
    const url = new URL(`https://${AUTH0_DOMAIN}/v2/logout`);
    url.searchParams.set("client_id", AUTH0_CLIENT_ID);
    url.searchParams.set("returnTo", returnTo);
    return url.toString();
  },

  async handleCallback(
    c: Context,
    redirectPath = AUTH0_REDIRECT_URI
  ): Promise<{ user: Auth0User }> {
    const url = new URL(c.req.url);
    const code = url.searchParams.get("code");
    if (!code) throw new Error("Missing code");

    const tokenRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: AUTH0_CLIENT_ID,
        client_secret: AUTH0_CLIENT_SECRET,
        code,
        redirect_uri: redirectPath,
      }),
    });

    const tokenData = (await tokenRes.json()) as TokenResponse;
    if (tokenData.error)
      throw new Error("Token exchange failed: " + tokenData.error);
    console.log("Token exchange successful:", tokenData);
    const user = await client.getUser(tokenData.access_token);
    console.log("User fetched:", user);

    await sessionManager.set(c, {
      user,
      id_token: tokenData.id_token,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
    });

    console.log("Session set successfully");
    let db_admin: {
      id: string;
      tenantId: string;
      email: string;
      name: string;
      authId: string | null;
      createdAt: Date;
    };

    try {
      db_admin = await getTenantUserFromAuthId(user.sub);
    } catch (error) {
      console.error("Failed to fetch DB admin:", error);
      throw new Error("Failed to fetch DB admin");
    }

    console.log("DB admin fetched:", db_admin);

    await SaveRLSToken(db_admin.id, tokenData.id_token);

    return { user };
  },

  async getUser(accessToken: string): Promise<Auth0User> {
    const res = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error("User fetch failed");

    const user = (await res.json()) as Auth0User;

    return user;
  },

  async silentLogin(c: Context): Promise<Auth0User | null> {
    const session = await sessionManager.get(c);
    return session?.user ?? null;
  },

  async refreshToken(c: Context): Promise<Auth0User | null> {
    const session = await sessionManager.get(c);
    if (!session?.refreshToken) return null;

    const res = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: AUTH0_CLIENT_ID,
        client_secret: AUTH0_CLIENT_SECRET,
        refresh_token: session.refreshToken,
      }),
    });

    const newToken = (await res.json()) as TokenResponse;
    if (!newToken.access_token) throw new Error("Refresh failed");

    const user = await client.getUser(newToken.access_token);

    const db_admin = await getTenantUserFromAuthId(user.sub);
    await SaveRLSToken(db_admin.id, newToken.id_token);

    await sessionManager.set(c, {
      user,
      accessToken: newToken.access_token,
      refreshToken: session.refreshToken,
    });

    return user;
  },

  announce(): void {
    console.log(`Auth0 client initialized at domain: ${AUTH0_DOMAIN}`);
  },
};

client.announce();
