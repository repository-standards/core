// ADR-047: ingest endpoint for the anonymous adoption ping.
// Accepts exactly the disclosed payload, ignores anything else, persists no request
// metadata (IP, headers) alongside it.

const MAX_LEN = 64;

function isValidPayload(body) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return false;
  if (Object.keys(body).length !== 6) return false;
  return (
    typeof body.event === "string" && body.event.length > 0 && body.event.length <= MAX_LEN &&
    typeof body.stack === "string" && body.stack.length > 0 && body.stack.length <= MAX_LEN &&
    typeof body.standards_version === "string" && body.standards_version.length > 0 && body.standards_version.length <= 32 &&
    Number.isInteger(body.drift) && body.drift >= 0 &&
    typeof body.fully_aligned === "boolean" &&
    typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
  );
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/") {
      return new Response("not found", { status: 404 });
    }

    // Public, read-only: the landing page fetches this client-side on every
    // load, so the number is always current with no build-time caching step.
    if (request.method === "GET") {
      const { count } = await env.DB.prepare("SELECT COUNT(*) AS count FROM adoptions").first();
      return new Response(JSON.stringify({ count }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    if (request.method !== "POST") {
      return new Response("method not allowed", { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("invalid json", { status: 400 });
    }

    if (!isValidPayload(body)) {
      return new Response("invalid payload", { status: 400 });
    }

    await env.DB.prepare(
      `INSERT INTO adoptions (event, stack, standards_version, drift, fully_aligned, date)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(body.event, body.stack, body.standards_version, body.drift, body.fully_aligned ? 1 : 0, body.date)
      .run();

    return new Response(null, { status: 204 });
  },
};
