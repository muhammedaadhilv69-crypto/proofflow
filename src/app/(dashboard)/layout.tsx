import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { logout } from "@/actions/auth";
import { getAuthenticatedContext } from "@/lib/authz";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";

const navigation = [
  { href: ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.projects, label: "Projects", icon: FolderKanban },
  { href: ROUTES.clients, label: "Clients", icon: Users },
  { href: ROUTES.activity, label: "Activity", icon: Activity },
  { href: ROUTES.settings, label: "Settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAuthenticatedContext();
  if (!context) redirect(ROUTES.login);
  const displayName =
    typeof context.user.user_metadata?.full_name === "string"
      ? context.user.user_metadata.full_name
      : context.user.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link
              href={ROUTES.dashboard}
              className="flex items-center gap-2 font-semibold"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                PF
              </span>
              <span className="hidden sm:inline">ProofFlow</span>
            </Link>
            <nav
              className="hidden items-center gap-1 md:flex"
              aria-label="Main navigation"
            >
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href={ROUTES.newProject}>
                <Plus className="mr-2 h-4 w-4" />
                New project
              </Link>
            </Button>
            <div className="hidden text-right sm:block">
              <p className="max-w-36 truncate text-sm font-medium">
                {displayName}
              </p>
              <p className="max-w-36 truncate text-xs text-muted-foreground">
                {context.workspace.name}
              </p>
            </div>
            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
        <nav
          className="flex gap-1 overflow-x-auto border-t px-4 py-2 md:hidden"
          aria-label="Mobile navigation"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center gap-1 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
