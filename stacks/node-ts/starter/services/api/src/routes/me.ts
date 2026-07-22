// The protected example route: whoami. The session-gate hook has already rejected
// unauthenticated requests (default-deny), so a session is present here - but the check
// stays explicit rather than asserted, because this file is the pattern people copy.

import type { FastifyInstance } from "fastify";

export async function meRoutes(app: FastifyInstance): Promise<void> {
  app.get("/me", async (request, reply) => {
    if (!request.session) {
      return reply
        .code(401)
        .send({ errorCode: "UNAUTHORIZED", message: "Authentication required" });
    }
    const { user } = request.session;
    return { user: { id: user.id, email: user.email, name: user.name } };
  });
}
