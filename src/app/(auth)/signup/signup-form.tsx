"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signup } from "@/actions/auth";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";

export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.set(key, value));
    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // When Supabase returns a session, email confirmation is disabled and the
    // account is already usable. Bouncing to a "check your email" page in that
    // case would send the user after an email that never arrives.
    if (result?.requiresConfirmation === false) {
      router.push(ROUTES.dashboard);
      router.refresh();
      return;
    }

    router.push(
      `${ROUTES.login}?message=${encodeURIComponent(
        result?.message ??
          "Account created. Check your email to confirm your account.",
      )}`,
    );
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          You get a workspace for your studio. Invite teammates when you need
          them.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {error ? <FormError>{error}</FormError> : null}

        <Field label="Full name" required hint="Shown on the approvals you record.">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              autoComplete="name"
              autoFocus
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              disabled={loading}
            />
          )}
        </Field>

        <Field label="Email" required>
          {({ id }) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="you@studio.com"
              required
              disabled={loading}
            />
          )}
        </Field>

        <Field label="Password" required hint="At least 8 characters.">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              required
              disabled={loading}
            />
          )}
        </Field>

        <Field label="Confirm password" required>
          {({ id }) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={form.confirmPassword}
              onChange={(event) =>
                setForm({ ...form, confirmPassword: event.target.value })
              }
              required
              disabled={loading}
            />
          )}
        </Field>

        <Button type="submit" block disabled={loading}>
          {loading ? "Creating account" : "Create account"}
        </Button>
      </form>

      <p className="text-sm text-ink-soft">
        Already have an account?{" "}
        <Link
          href={ROUTES.login}
          className="link-inline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}