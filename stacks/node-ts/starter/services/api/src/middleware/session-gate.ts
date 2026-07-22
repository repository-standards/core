// Default-deny session gate (DECISIONS.md #10). The Next.js proxy already gates for UX;
// this hook is the actual security boundary - every route that is not explicitly public
// requires a valid, DB-backed (revocable) Better Auth session. The cookie arrives via
// the web app's /api/* rewrite and is validated against the same database the web app
// writes to, because both sides import the same @starter/auth instance.

import { auth, type Session } from "@starter/auth";
import type { FastifyReply, FastifyRequest } from "fastify";
import { toWebHeaders } from "../lib/headers.ts";
import { isPublicApiPath } from "../lib/public-paths.ts";

declare module "fastify" {
  interface FastifyRequest {
    session: Session | null;
  }
}

export async function sessionGate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (isPublicApiPath(request.url)) return;

  const session = await auth.api.getSession({ headers: toWebHeaders(request.headers) });
  if (!session) {
    await reply.code(401).send({ errorCode: "UNAUTHORIZED", message: "Authentication required" });
    return;
  }
  request.session = session;
}
