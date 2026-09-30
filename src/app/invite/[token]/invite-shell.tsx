import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AcceptInviteForm } from "./accept-invite-form";

export function InviteShell({
  token,
  email,
  workspaceName,
  isValid,
  signedIn,
}: {
  token: string;
  email: string | null;
  workspaceName: string | null;
  isValid: boolean;
  signedIn: boolean;
}) {
  if (!isValid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This invitation is no longer valid</CardTitle>
          <CardDescription>
            It has already been used, revoked, or has expired. Ask the person who
            invited you to send a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Join {workspaceName ? <span>{workspaceName}</span> : "this workspace"}
        </CardTitle>
        <CardDescription>
          {email ? (
            <>
              This invitation was sent to <span className="font-medium text-foreground">{email}</span>.
              You must be signed in with that address to accept it.
            </>
          ) : (
            "Sign in to accept this invitation."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AcceptInviteForm token={token} signedIn={signedIn} />
        {signedIn ? (
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
