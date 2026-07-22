// Fastify service - native plugin DI, no container (see ../../DECISIONS.md #5).
// Dependencies are plugins registered on the instance and request-scoped state rides on
// hooks / decorateRequest - not an IoC container.
//
// Runs as TypeScript directly on Node 24+ (native type stripping) - `pnpm dev` watches,
// `pnpm start` runs the same entry. Relative imports therefore use explicit .ts
// extensions (tsconfig: allowImportingTsExtensions).

import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { config } from "./config.ts";
import { sessionGate } from "./middleware/session-gate.ts";
import { healthRoutes } from "./routes/health.ts";
import { meRoutes } from "./routes/me.ts";

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: config.LOG_LEVEL },
    disableRequestLogging: true, // we log via the onResponse hook below, with our own shape
  });

  // Cross-cutting plugins (the "middleware" layer). Order matters.
  await app.register(helmet);
  await app.register(cors, {
    origin: config.CORS_ORIGIN ? config.CORS_ORIGIN.split(",") : false,
  });
  await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });

  // Default-deny: every request that is not on the public allow-list must carry a valid
  // session (DECISIONS.md #10 - the proxy is UX, this service is the boundary).
  app.decorateRequest("session", null);
  app.addHook("onRequest", sessionGate);

  // One error contract for the whole surface.
  app.setErrorHandler((error, request, reply) => {
    const status = error.statusCode ?? 500;
    if (status >= 500) request.log.error({ err: error }, "unhandled error");
    reply.status(status).send({
      errorCode: error.code ?? "INTERNAL_ERROR",
      message: status >= 500 ? "Internal Server Error" : error.message,
    });
  });

  // Request lifecycle logging (structured, one line per request).
  app.addHook("onResponse", async (request, reply) => {
    request.log.info(
      { method: request.method, url: request.url, status: reply.statusCode, ms: reply.elapsedTime },
      "request",
    );
  });

  // Routes (the "routes" layer), all under /api - the same path the browser used, so the
  // web app's rewrite forwards verbatim (apps/web/next.config.ts).
  await app.register(
    async (api) => {
      await api.register(healthRoutes);
      await api.register(meRoutes);
    },
    { prefix: "/api" },
  );

  return app;
}

async function start(): Promise<void> {
  const app = await buildServer();
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      app.log.info(`${signal} received, shutting down`);
      app.close().then(() => process.exit(0));
    });
  }
  await app.listen({ host: config.HOST, port: config.PORT });
}

// Only start when run directly, not when imported by a test.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
