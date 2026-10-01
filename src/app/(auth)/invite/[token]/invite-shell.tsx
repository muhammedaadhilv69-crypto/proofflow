import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plate, PlateBody, PlateHeader, PlateTitle } from "@/components/ui/plate";
import { SlugLine } from "@/components/slug-line";
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
      <Plate accentTop>
        <PlateHeader>
          <PlateTitle>This invitation is no longer valid</PlateTitle>
        </PlateHeader>
        <PlateBody className="space-y-4">
          <p className="text-sm leading-relaxed text-ink-soft">
            It has already been used, revoked, or has expired. Ask whoever
            invited you to send a new one.
          </p>
          <Button asChild block>
            <Link href="/login">Go to sign in</Link>
          </Button>
        </PlateBody>
      </Plate>
    );
  }

  return (
    <Plate accentTop>
      <PlateHeader>
        <PlateTitle>Join {workspaceName ?? "this workspace"}</PlateTitle>
      </PlateHeader>
      <PlateBody className="space-y-4">
        {email ? (
          <>
            <p className="text-sm leading-relaxed text-ink-soft">
              This invitation was sent to a specific address. You must be signed
              in as that person to accept it.
            </p>
            <SlugLine items={[{ key: "invited", value: email }]} />
          </>
        ) : (
          <p className="text-sm leading-relaxed text-ink-soft">
            Sign in to accept this invitation.
          </p>
        )}

        <AcceptInviteForm token={token} signedIn={signedIn} />

        {signedIn ? (
          <Button asChild variant="ghost" block>
            <Link href="/dashboard">Back to the dashboard</Link>
          </Button>
        ) : null}
      </PlateBody>
    </Plate>
  );
}