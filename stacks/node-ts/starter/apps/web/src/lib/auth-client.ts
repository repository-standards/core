// Better Auth client for React components. Same-origin (the app itself hosts
// /api/auth/* via the route handler), so no baseURL is needed.

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
