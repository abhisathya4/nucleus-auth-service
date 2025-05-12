import { createFactory } from "hono/factory";
import type { MiddlewareEnv } from "./models/MiddlewareEnv";

export const middlewareFactory = createFactory<MiddlewareEnv>();
