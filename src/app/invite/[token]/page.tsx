import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { previewInvitation } from "@/lib/team";
import { InviteShell } from "./invite-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workspace invitation | ProofFlow",
  robots: { index: false, follow: false },
};

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
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <p className="text-center text-lg font-semibold">ProofFlow</p>
        <InviteShell
          token={token}
          email={preview?.email ?? null}
          workspaceName={preview?.workspaceName ?? null}
          isValid={preview?.isValid ?? false}
          signedIn={Boolean(data.user)}
        />
      </div>
    </main>
  );
}
