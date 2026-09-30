"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { acceptInvitationAction } from "@/actions/team";
import { Button } from "@/components/ui/button";

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
      <div className="space-y-2">
        <Button asChild className="w-full">
          <Link href="/login">Sign in to accept</Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          No account yet? <Link href="/signup" className="text-primary hover:underline">Create one</Link> with the invited address.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      <Button className="w-full" onClick={accept} disabled={loading}>
        {loading ? "Joining..." : "Accept invitation"}
      </Button>
    </div>
  );
}
