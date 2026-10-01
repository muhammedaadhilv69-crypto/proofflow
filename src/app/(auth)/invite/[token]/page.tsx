import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { previewInvitation } from "@/lib/team";
import { InviteShell } from "./invite-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workspace invitation",
  robots: { index: false, follow: false },
};

/**
 * Lives in the `(auth)` group so it inherits the same split shell as sign-in
 * and sign-up. An invitation is reached from an email by someone who has never
 * seen the product, so it should look like the same front door rather than a
 * second one.
 */
export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [preview, supabase] = await Promise.all([
    previewInvitation(token),
    createClient(),
  ]);
  const { data } = await supabase.auth.getUser();

  return (
    <InviteShell
      token={token}
      email={preview?.email ?? null}
      workspaceName={preview?.workspaceName ?? null}
      isValid={preview?.isValid ?? false}
      signedIn={Boolean(data.user)}
    />
  );
}