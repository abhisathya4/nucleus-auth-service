// sessionManager.d.ts

import type { Context } from "hono";
import type { Auth0Session } from "./auth0Client";

export interface Auth0SessionManager {
  set(c: Context, session: Auth0Session): Promise<void>;
  get(c: Context): Promise<Auth0Session | null>;
  clear(c: Context): void;
}
