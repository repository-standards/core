// Better Auth's HTTP surface (sign-up, sign-in, sign-out, get-session, ...) mounted as a
// Next route handler. Route handlers win over the /api/* rewrite (afterFiles), so
// /api/auth/* is served here while the rest of /api/* proxies to the Fastify service.

import { auth } from "@starter/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
