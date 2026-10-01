"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/actions/auth";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";

export function LoginForm({
  message,
  redirectTo,
}: {
  message?: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">
          Sign in
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Sign in to send review links and collect approvals.
        </p>
      </div>

      {message ? (
        <p
          role="status"
          className="rounded-control bg-seal px-3 py-2.5 text-sm leading-relaxed text-ink"
        >
          {message}
        </p>
      ) : null}

      <form onSubmit={submit} className="space-y-5">
        {error ? <FormError>{error}</FormError> : null}

        <Field label="Email" required>
          {({ id }) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@studio.com"
              required
              disabled={loading}
              invalid={Boolean(error)}
            />
          )}
        </Field>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-4">
            <label
              htmlFor="password"
              className="label-narrow text-xs font-medium text-ink-soft"
            >
              Password
            </label>
            <Link
              href={ROUTES.forgotPassword}
              className="text-xs text-signal underline-offset-4 hover:underline"
            >
              Forgot password
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={loading}
            invalid={Boolean(error)}
          />
        </div>

        <Button type="submit" block disabled={loading}>
          {loading ? "Signing in" : "Sign in"}
        </Button>
      </form>

      <p className="text-sm text-ink-soft">
        No account yet?{" "}
        <Link
          href={ROUTES.signup}
          className="text-signal underline-offset-4 hover:underline"
        >
          Create a workspace
        </Link>
      </p>
    </div>
  );
}