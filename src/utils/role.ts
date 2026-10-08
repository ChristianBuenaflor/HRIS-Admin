interface StoredUser {
  role_id?: number | string | null;
  role_name?: string | null;
  [key: string]: unknown;
}

function readStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function getRoleId(): number | null {
  const user = readStoredUser();
  if (user?.role_id !== undefined && user?.role_id !== null && user?.role_id !== "") {
    const id = typeof user.role_id === "string" ? parseInt(user.role_id, 10) : user.role_id;
    return Number.isNaN(id) ? null : id;
  }
  return null;
}

export function getRoleName(): string {
  const user = readStoredUser();
  if (user?.role_name) return String(user.role_name);
  const nestedRole = (user as StoredUser | null)?.role;
  if (typeof nestedRole === "string" && nestedRole) return nestedRole;
  try {
    return localStorage.getItem("role") ?? "";
  } catch {
    return "";
  }
}

function roleNameNormalized(): string {
  return getRoleName().trim().toLowerCase().replace(/[_\s]+/g, " ");
}

function getRoleIdNumber(): number | null {
  const user = readStoredUser();
  const raw = user?.role_id;
  if (raw === undefined || raw === null || raw === "") return null;
  const id = typeof raw === "string" ? parseInt(raw, 10) : raw;
  return Number.isNaN(id) ? null : id;
}

const SUPER_ADMIN_NAMES = new Set(["super admin", "superadmin"]);
const ADMIN_NAMES = new Set(["admin"]);

type DetectedRole = "superadmin" | "admin" | "unknown";
let warnedUnknown = false;

function currentRole(): DetectedRole {
  if (SUPER_ADMIN_NAMES.has(roleNameNormalized()) || getRoleIdNumber() === 1) {
    return "superadmin";
  }
  if (ADMIN_NAMES.has(roleNameNormalized()) || getRoleIdNumber() === 2) {
    return "admin";
  }
  if (!warnedUnknown) {
    warnedUnknown = true;
    console.warn(
      `[role] Unrecognized role (name=${JSON.stringify(getRoleName())} id=${JSON.stringify(readStoredUser()?.role_id ?? null)}). Falling back to full access.`
    );
  }
  return "unknown";
}

export function isSuperAdmin(): boolean {
  return currentRole() === "superadmin";
}

export function isAdmin(): boolean {
  return currentRole() === "admin";
}

/** Sidebar / route access for the Admin role. Super Admin always has access. */
export function isAdminAllowedMenu(menuId: string): boolean {
  const allowed = new Set(["dashboard", "attendance-leave", "payroll", "announcement", "setup"]);
  return allowed.has(menuId);
}

export function isAdminAllowedRoute(path: string): boolean {
  const normalized = path.replace(/\/+$/, "").toLowerCase();
  const allowedExact = new Set([
    "dashboard",
    "attendance-leaving",
    "payroll",
    "announcement",
    "settings",
    "setup-manager",
    "setup/holidays",
  ]);
  const segment = normalized.replace(/^\//, "");
  if (allowedExact.has(segment)) return true;
  if (segment === "" || segment === "/") return true;
  return false;
}

export function isAdminAllowedSetupCard(cardId: string): boolean {
  return cardId === "holidays";
}

export function hasRouteAccess(path: string): boolean {
  if (isSuperAdmin()) return true;
  if (isAdmin()) return isAdminAllowedRoute(path);
  return true;
}
