// The protected page. The proxy gate has already redirected anonymous visitors, but the
// page still verifies the session itself - defense in depth, and it needs the user
// anyway. Server component: the session read happens on the server, nothing leaks.

import { auth } from "@starter/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import styles from "./page.module.scss";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in?next=/dashboard");

  return (
    <main className={styles.main}>
      <section className={styles.card}>
        <h1>Dashboard</h1>
        <p>
          Signed in as <strong>{session.user.email}</strong>
        </p>
        <p>
          The API answers you too: <code>GET /api/me</code> rides the same cookie through the
          rewrite and is validated again by Fastify.
        </p>
        <SignOutButton />
      </section>
    </main>
  );
}
