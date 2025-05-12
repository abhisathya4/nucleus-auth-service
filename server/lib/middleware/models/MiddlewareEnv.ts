import type { AuthUser } from "./AuthUser";

export type MiddlewareEnv = {
  Variables: {
    user: AuthUser | null;
    rls_token: string | null;
  };
};
