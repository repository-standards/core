// A route registered as a Fastify plugin - the native-DI unit of composition. Add your
// domain routes the same way and register them in server.ts.

import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({ status: "ok" }));
  // Readiness can check dependencies (db, queues) and return 503 when not ready.
  app.get("/ready", async () => ({ status: "ready" }));
}
