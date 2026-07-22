// Fastify hands us Node's IncomingHttpHeaders; Better Auth's API takes WHATWG Headers.

import type { IncomingHttpHeaders } from "node:http";

export function toWebHeaders(raw: IncomingHttpHeaders): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.append(key, value);
    }
  }
  return headers;
}
