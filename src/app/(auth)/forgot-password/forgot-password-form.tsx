"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/actions/auth";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const formData = new FormData();
    formData.set("email", email);
    const result = await forgotPassword(formData);
    if (result?.error) setError(result.error);
    else if (result?.message) setMessage(result.message);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">
          Reset your password
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Enter the email you sign in with. If an account exists, a reset link
          is on its way.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {error ? <FormError>{error}</FormError> : null}
        {message ? (
          <p
            role="status"
            className="rounded-control bg-seal px-3 py-2.5 text-sm leading-relaxed text-ink"
          >
            {message}
          </p>
        ) : null}

        <Field label="Email" required>
          {({ id }) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={loading}
              invalid={Boolean(error)}
            />
          )}
        </Field>

        <Button type="submit" block disabled={loading}>
          {loading ? "Sending" : "Send reset link"}
        </Button>
      </form>

      <p className="text-sm">
        <Link
          href={ROUTES.login}
          className="link-inline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}