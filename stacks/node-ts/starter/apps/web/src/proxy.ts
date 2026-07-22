// Next 16 proxy (the middleware.ts replacement; Node runtime) - the UX half of the
// default-deny auth gate (DECISIONS.md #10). Because it runs on the Node runtime it can
// query the session database through Better Auth, so the gate is REVOCABLE - deleting a
// session row locks the cookie out immediately, unlike a JWT-blind check.
//
// The Fastify service enforces the same policy again on its side (the boundary); this
// layer exists so unauthenticated users get a redirect, not a JSON 401, on page loads.

import { auth } from "@starter/auth";
import { type NextRequest, NextResponse } from "next/server";
import { isPublicPath } from "@/lib/routes";

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const session = await auth.api.getSession({ headers: request.headers });
  if (session) return NextResponse.next();

  // API calls get a machine answer; page loads get sent to sign-in.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { errorCode: "UNAUTHORIZED", message: "Authentication required" },
      { status: 401 },
    );
  }
  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("next", pathname);
  return NextResponse.redirect(signIn);
}

export const config = {
  // Gate everything except framework internals and static files; the code above decides
  // what is public. Default-deny means a new route is protected until listed.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
