export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
  projects: "/projects",
  clients: "/clients",
  activity: "/activity",
  settings: "/settings",
  newProject: "/projects/new",
  features: "/features",
  pricing: "/pricing",
} as const;

/**
 * Invitations live at a dynamic segment, so this is a prefix rather than a
 * servable route. Kept separate from ROUTES so route validation does not treat
 * a prefix as a page.
 */
export const INVITE_PATH_PREFIX = "/invite";

export function invitePath(token: string) {
  return `${INVITE_PATH_PREFIX}/${token}`;
}

export const REVIEW_PATH_PREFIX = "/review";

export function reviewPath(token: string) {
  return `${REVIEW_PATH_PREFIX}/${token}`;
}

export const PROTECTED_PATHS: readonly string[] = [
  ROUTES.dashboard,
  ROUTES.projects,
  ROUTES.clients,
  ROUTES.activity,
  ROUTES.settings,
];

export const GUEST_ONLY_PATHS: readonly string[] = [
  ROUTES.login,
  ROUTES.signup,
  ROUTES.forgotPassword,
];

export function isProtectedPath(pathname: string) {
  return matchesPath(pathname, PROTECTED_PATHS);
}

export function isGuestOnlyPath(pathname: string) {
  return matchesPath(pathname, GUEST_ONLY_PATHS);
}

function matchesPath(pathname: string, paths: readonly string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * Only same-origin, non-protocol-relative paths are accepted so that a crafted
 * `?redirect=` value cannot bounce a freshly authenticated user off-site.
 */
export function safeRedirectTarget(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return null;
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.startsWith("/\\")
  )
    return null;
  if (candidate.includes("\\") || /[\r\n]/.test(candidate)) return null;
  return candidate;
}
