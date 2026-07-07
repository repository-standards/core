// Fastify service - native plugin DI, no container (both stayget and propertycloud do this;
// see ../../DECISIONS.md #5). Dependencies are plugins registered on the instance and
// request-scoped state rides on hooks / decorateRequest - not an IoC container.

import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config.js";
import { healthRoutes } from "./routes/health.js";

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

  // One error contract for the whole surface (decide throw-vs-result once; see the
  // decision catalog "Error & result modeling").
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

  // Routes (the "routes" layer). Register domain plugins here.
  await app.register(healthRoutes);

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
