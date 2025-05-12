// auth0Client.d.ts

import type { Context } from "hono";
import type { JWTPayload } from "hono/utils/jwt/types";

export interface Auth0Session extends JWTPayload {
  user: Auth0User;
  accessToken: string;
  refreshToken?: string;
}

export interface Auth0User {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  [key: string]: any;
}

export interface Auth0Client {
  login(redirectPath?: string): string;
  logout(returnTo?: string): string;
  handleCallback(c: Context, redirectPath?: string): Promise<{ user: Auth0User }>;
  getUser(accessToken: string, c: any): Promise<Auth0User>;
  silentLogin(c: any): Promise<Auth0User | null>;
  refreshToken(c: any): Promise<Auth0User | null>;
  announce(): void;
}
