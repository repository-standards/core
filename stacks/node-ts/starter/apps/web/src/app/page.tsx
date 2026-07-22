import Link from "next/link";
import styles from "./page.module.scss";

export default function HomePage() {
  return (
    <main className={styles.main}>
      <section className={styles.card}>
        <h1>Starter</h1>
        <p>
          Next.js App Router on :3000, Fastify on :4000 behind the /api/* rewrite, Better Auth with
          DB-backed sessions validated at both gates. This page is public; the dashboard is not.
        </p>
        <div className={styles.actions}>
          <Link href="/sign-up">Create account</Link>
          <Link href="/sign-in">Sign in</Link>
          <Link href="/dashboard">Dashboard (needs a session)</Link>
        </div>
      </section>
    </main>
  );
}
