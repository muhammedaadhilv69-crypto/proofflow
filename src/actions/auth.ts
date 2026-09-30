"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedContext } from "@/lib/authz";
import { loginSchema, signupSchema } from "@/lib/validation";
import { trackEvent } from "@/lib/analytics";
import { requireAppUrl } from "@/lib/app-url";
import { ROUTES } from "@/lib/routes";
import { checkRateLimit, clientIpFromHeaders, decideForAuth } from "@/lib/rate-limit";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export type AuthActionResult = {
  success: boolean;
  message?: string;
  error?: string;
  /**
   * True when Supabase still needs the user to click a confirmation link.
   * False when signup returned a session, meaning the account is usable now.
   */
  requiresConfirmation?: boolean;
};

function authFailure(error: string): AuthActionResult {
  return { success: false, error };
}

async function callerIp() {
  return clientIpFromHeaders(await headers());
}

/**
 * Two ceilings per credential: a short burst limit to blunt online guessing and
 * a long one to cap sustained distributed attempts against a known address.
 */
async function limitAuthAttempt(
  scope: string,
  identity: string,
  ip: string,
): Promise<boolean> {
  const normalized = identity.toLowerCase().slice(0, 254);
  const burst = await checkRateLimit(
    `auth:${scope}:burst:${ip}`,
    20,
    15 * MINUTE,
  );
  if (!decideForAuth(burst)) return false;

  if (!normalized) return true;

  const sustained = await checkRateLimit(
    `auth:${scope}:account:${normalized}`,
    30,
    DAY,
  );
  return decideForAuth(sustained);
}

export async function signup(formData: FormData): Promise<AuthActionResult> {
  const parsed = signupSchema.safeParse({
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
  });

  if (!parsed.success)
    return authFailure(parsed.error.issues[0]?.message || "Check your details");
  if (parsed.data.password !== parsed.data.confirmPassword)
    return authFailure("Passwords do not match");

  const ip = await callerIp();
  if (!(await limitAuthAttempt("signup", parsed.data.email, ip)))
    return authFailure("Too many attempts. Try again later.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.name } },
  });

  if (error) return authFailure(error.message);
  if (!data.user)
    return {
      success: true,
      message: "Check your email to confirm your account",
      requiresConfirmation: true,
    };

  try {
    const admin = createAdminClient();
    const { error: workspaceError } = await admin.rpc(
      "ensure_workspace_for_user",
      {
        p_user_id: data.user.id,
        p_workspace_name: `${parsed.data.name}'s workspace`,
      },
    );
    if (workspaceError)
      return authFailure(
        "Your account was created, but workspace setup failed. Please sign in and try again.",
      );
    await trackEvent("workspace_created", { user_id: data.user.id });
  } catch {
    return authFailure(
      "Your account was created, but workspace setup is not configured yet.",
    );
  }

  // A session here means Supabase email confirmation is disabled, so telling
  // the user to check their inbox would send them after an email that never
  // arrives. Send them straight into the app instead.
  if (data.session)
    return { success: true, message: "Account created.", requiresConfirmation: false };

  return {
    success: true,
    message: "Account created. Check your email to confirm your account.",
    requiresConfirmation: true,
  };
}

export async function login(formData: FormData): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });
  if (!parsed.success)
    return authFailure(parsed.error.issues[0]?.message || "Check your details");

  const ip = await callerIp();
  if (!(await limitAuthAttempt("login", parsed.data.email, ip)))
    return authFailure("Too many attempts. Try again in a few minutes.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Deliberately not leaking which half was wrong.
  if (error) return authFailure("Email or password is incorrect");
  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROUTES.login);
}

export async function forgotPassword(
  formData: FormData,
): Promise<AuthActionResult> {
  const email = formString(formData, "email").trim();
  if (!email) return authFailure("Email is required");

  const ip = await callerIp();
  if (!(await limitAuthAttempt("forgot-password", email, ip)))
    return authFailure("Too many requests. Try again later.");

  const supabase = await createClient();
  const appUrl = requireAppUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}${ROUTES.resetPassword}`,
  });
  // Always reports success so the form cannot be used to enumerate accounts.
  if (error) {
    console.error("Password reset request failed", {
      message: error.message,
    });
  }
  return {
    success: true,
    message: "If that address has an account, a reset link is on its way",
  };
}

export async function resetPassword(
  formData: FormData,
): Promise<AuthActionResult> {
  const password = formString(formData, "password");
  const confirmPassword = formString(formData, "confirmPassword");
  const code = formString(formData, "code");
  if (password.length < 8)
    return authFailure("Password must be at least 8 characters");
  if (password !== confirmPassword)
    return authFailure("Passwords do not match");

  const supabase = await createClient();
  if (code) {
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError)
      return authFailure("This reset link is invalid or expired");
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user)
    return authFailure("This reset link is invalid or expired");

  const ip = await callerIp();
  if (!(await limitAuthAttempt("reset-password", userData.user.email || "", ip)))
    return authFailure("Too many attempts. Try again later.");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return authFailure(error.message);
  return { success: true, message: "Password updated successfully" };
}

export async function getWorkspace() {
  const context = await getAuthenticatedContext();
  if (!context) return null;
  return { workspace: context.workspace, role: context.role };
}
