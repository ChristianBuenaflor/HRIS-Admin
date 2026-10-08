
export type UserRole = "Admin" | "Super Admin" | "Unknown";

export function getUserRole(): UserRole {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    // Prefer role_name from the API user object.
    const role = String(
      user.role_name || localStorage.getItem("role") || ""
    ).trim().toLowerCase();

    if (role === "super admin") return "Super Admin";
    if (role === "admin") return "Admin";

    return "Unknown";
  } catch {
    return "Unknown";
  }
}

export const ADMIN_ROUTES = [
  "/dashboard",
  "/attendance-leaving",
  "/payroll",
  "/announcement",
  "/setup-manager",
  "/setup/holidays",
  "/settings",
];

export function canAccessPath(
  path: string,
  role: UserRole = getUserRole()
): boolean {
  if (role === "Super Admin") return true;
  if (role !== "Admin") return false;

  return ADMIN_ROUTES.includes(path);
}
