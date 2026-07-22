"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import styles from "../auth.module.scss";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (result.error) {
      setError(result.error.message ?? "Sign-in failed");
      setPending(false);
      return;
    }
    // The proxy gate appends ?next=<original path> when it redirects here.
    const nextPath = new URLSearchParams(window.location.search).get("next") ?? "/dashboard";
    router.push(nextPath.startsWith("/") ? nextPath : "/dashboard");
    router.refresh();
  }

  return (
    <main className={styles.main}>
      <form className={styles.card} onSubmit={onSubmit}>
        <h1>Sign in</h1>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {error ? (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={pending}>
          Sign in
        </button>
        <p>
          No account yet? <Link href="/sign-up">Create one</Link>
        </p>
      </form>
    </main>
  );
}
