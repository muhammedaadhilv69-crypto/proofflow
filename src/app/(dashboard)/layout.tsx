import { logout } from "@/actions/auth";
import { getUserName, requireAuthenticatedContext } from "@/lib/authz";
import { ROUTES } from "@/lib/routes";
import { initials } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";

const navigation = [
  { href: ROUTES.dashboard, label: "Dashboard" },
  { href: ROUTES.projects, label: "Projects" },
  { href: ROUTES.clients, label: "Clients" },
  { href: ROUTES.activity, label: "Activity" },
  { href: ROUTES.settings, label: "Settings" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireAuthenticatedContext();

  return (
    <AppShell
      items={navigation}
      displayName={getUserName(context.user)}
      email={context.user.email ?? null}
      workspaceName={context.workspace.name}
      dashboardHref={ROUTES.dashboard}
      settingsHref={ROUTES.settings}
      logoutAction={logout}
      initials={initials(getUserName(context.user))}
    >
      {children}
    </AppShell>
  );
}