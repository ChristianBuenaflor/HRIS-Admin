import api from "@/utils/axios";

interface RoleUserEntry {
  id: number | string;
  username?: string | null;
  email?: string | null;
  role_id?: number | string | null;
  role_name?: string | null;
}

interface UsersListResponse {
  isSuccess: boolean;
  users?: RoleUserEntry[];
}

/**
 * Enrich the stored login session with the real privilege from GET /users.
 * Login returns only a guard string (role: "user") with no role fields, while
 * /users carries role_id / role_name (1 = Super Admin, 2 = Admin).
 * Never throws; returns false when hydration was skipped or impossible so
 * callers keep the legacy authenticated-fallback behavior.
 */
export async function hydrateStoredRole(): Promise<boolean> {
  try {
    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");
    if (!token || !rawUser) return false;

    let user: Record<string, unknown>;
    try {
      user = JSON.parse(rawUser) as Record<string, unknown>;
    } catch {
      return false;
    }

    const hasId = user["role_id"] !== undefined && user["role_id"] !== null && user["role_id"] !== "";
    if (hasId && user["role_name"]) return true;

    const res = await api.get<UsersListResponse>("/users", { params: { per_page: 100 } });
    const users = res.data?.users ?? [];
    const uid = String(user["id"] ?? "");
    const uname = String(user["username"] ?? "").toLowerCase();
    const email = String(user["email"] ?? "").toLowerCase();
    const match = users.find(
      (u) =>
        (uid !== "" && String(u.id) === uid) ||
        (uname !== "" && String(u.username ?? "").toLowerCase() === uname) ||
        (email !== "" && String(u.email ?? "").toLowerCase() === email)
    );
    if (!match) return false;

    localStorage.setItem("user", JSON.stringify({ ...user, role_id: match.role_id, role_name: match.role_name }));
    if (match.role_name) localStorage.setItem("role", String(match.role_name));
    return true;
  } catch {
    return false;
  }
}
