"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { acceptInvitationAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";

export function AcceptInviteForm({
  token,
  signedIn,
}: {
  token: string;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function accept() {
    setLoading(true);
    setError("");
    const data = new FormData();
    data.set("token", token);
    const result = await acceptInvitationAction(data);
    if (result && "error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (!signedIn) {
    return (
      <div className="space-y-3">
        <Button asChild block>
          <Link href="/login">Sign in to accept</Link>
        </Button>
        <p className="text-xs leading-relaxed text-ink-faint">
          No account yet?{" "}
          <Link
            href="/signup"
            className="text-signal underline-offset-4 hover:underline"
          >
            Create one
          </Link>{" "}
          using the invited email address.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? <FormError>{error}</FormError> : null}
      <Button block onClick={accept} disabled={loading}>
        {loading ? "Joining" : "Accept invitation"}
      </Button>
    </div>
  );
}