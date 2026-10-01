"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/actions/auth";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";

export function ResetPasswordForm({ code }: { code?: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const mismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.set("password", password);
    formData.set("confirmPassword", confirmPassword);
    if (code) formData.set("code", code);
    const result = await resetPassword(formData);
    if (result?.error) setError(result.error);
    else if (result?.success) setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">
            Password updated
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            You can sign in with it now.
          </p>
        </div>
        <Button asChild block>
          <Link href={ROUTES.login}>Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">
          Choose a new password
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          At least 8 characters. You will use this every time you sign in.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {error ? <FormError>{error}</FormError> : null}

        <Field label="New password" required>
          {({ id }) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              autoFocus
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
              invalid={Boolean(error)}
            />
          )}
        </Field>

        <Field
          label="Confirm password"
          required
          error={mismatch ? "The two passwords do not match." : undefined}
        >
          {({ id, invalid }) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              disabled={loading}
              invalid={invalid || Boolean(error)}
            />
          )}
        </Field>

        <Button
          type="submit"
          block
          disabled={loading || mismatch || !password || !confirmPassword}
        >
          {loading ? "Updating" : "Update password"}
        </Button>
      </form>
    </div>
  );
}