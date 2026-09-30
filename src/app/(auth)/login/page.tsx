import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROUTES, safeRedirectTarget } from "@/lib/routes";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; redirect?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect(ROUTES.dashboard);
  return (
    <LoginForm
      message={params.message}
      redirectTo={safeRedirectTarget(params.redirect) ?? ROUTES.dashboard}
    />
  );
}
