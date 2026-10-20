import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  DollarSign,
  Settings,
  Settings2,
  LogOut,
  BarChart3,
  UserPlus,
  HandCoins,
  BookUser,
  Building2,
  TreePine,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { isAdmin, isAdminAllowedMenu, isAuthenticated, isSuperAdmin } from "@/utils/role";
import { isMenuActive } from "./activeMenu";

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  link: string;
  /** Extra routes that belong to this menu item. */
  activeLinks?: string[];
}

const menuItems: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, link: "/dashboard" },
  { id: "employees", label: "Employees", icon: Users, link: "/employees" },
  { id: "recruitment", label: "Recruitment & Onboarding", icon: UserPlus, link: "/recruitment-onboarding" },
  { id: "jobposting", label: "Job Posting", icon: BookUser, link: "/job-posting" },
  { id: "attendance-leave", label: "Attendance & Leave", icon: Clock, link: "/attendance-leaving" },
  { id: "attendance-calendar", label: "Attendance Calendar", icon: CalendarDays, link: "/attendance-calendar" },
  { id: "payroll", label: "Payroll & Benefits", icon: DollarSign, link: "/payroll" },
  { id: "thirteen-pay", label: "13th Month Generator", icon: TreePine, link: "/christmas-bonus" },
  { id: "loan-management", label: "Loan Management", icon: HandCoins, link: "/loan-management" },
  { id: "reports", label: "Reports & Analytics", icon: BarChart3, link: "/reports-analytics" },
  { id: "announcement", label: "Announcement", icon: Megaphone, link: "/announcement" },
  { id: "setup", label: "Setup Manager", icon: Settings2, link: "/setup-manager", activeLinks: ["/setup"] },
];

export function SidebarComponent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Computed every render (not memoized): role lives in localStorage and can
  // change on login/logout without remounting this component.
  // Unauthenticated => no items. Authenticated with generic backend role
  // (e.g. "user") keeps legacy full access; positively-identified admins
  // are restricted to their allowlist.
  const visibleMenuItems = !isAuthenticated()
    ? []
    : isSuperAdmin()
      ? menuItems
      : isAdmin()
        ? menuItems.filter((item) => isAdminAllowedMenu(item.id))
        : menuItems;

  const showSettings = isAuthenticated() && !isAdmin();

  // Dynamic footer: read the logged-in user every render (same pattern as
  // the role checks above). Falls back to the generic label when storage
  // is empty or unreadable.
  const storedUser = (() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      return JSON.parse(raw) as {
        first_name?: string | null;
        last_name?: string | null;
        name?: string | null;
        username?: string | null;
        email?: string | null;
        role_name?: string | number | null;
        profile_picture?: string | null;
      };
    } catch {
      return null;
    }
  })();

  const displayName =
    [storedUser?.first_name, storedUser?.last_name].filter(Boolean).join(" ") ||
    storedUser?.name ||
    storedUser?.username ||
    "Admin User";
  const displaySub =
    storedUser?.email ||
    (storedUser?.role_name ? String(storedUser.role_name) : "") ||
    "";
  const initials =
    displayName
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase() || "AD";

  const handleButton = (link: string) => {
    navigate(link);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const { default: api } = await import("@/utils/axios");
        await api.post("/logout").catch(() => undefined);
      }
    } catch {
      // Ignore logout endpoint failures; always clear local session.
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      navigate("/", { replace: true });
    }
  };

  return (
    <Sidebar className="bg-indigo-600 text-white flex flex-col justify-between">
      <SidebarHeader className="bg-indigo-600">
        <div className="flex items-center space-x-3 px-4 py-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-white">HRIS System</h2>
            <p className="text-xs text-indigo-200">Human Resources</p>
          </div>
        </div>
      </SidebarHeader >

      <SidebarContent className="p-3 bg-indigo-600">
        <SidebarMenu>
          {visibleMenuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => handleButton(item.link)}
                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 transition-colors
                  ${isMenuActive(location.pathname, item.link, ...(item.activeLinks ?? []))
                    ? "bg-white text-indigo-600 font-semibold"
                    : "text-white hover:bg-indigo-500"
                  }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="bg-indigo-600">
        <div className="px-4 py-3 space-y-3 border-t border-indigo-500">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8 bg-white text-indigo-600 font-bold">
              {storedUser?.profile_picture ? (
                <AvatarImage src={storedUser.profile_picture} alt={displayName} className="object-cover" />
              ) : (
                <AvatarFallback>{initials}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-white">{displayName}</div>
              {displaySub && (
                <div className="text-xs text-indigo-200 truncate">{displaySub}</div>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            {showSettings && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-white text-indigo-600 hover:bg-indigo-100"
              onClick={() => handleButton("settings")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-white text-indigo-600 hover:bg-indigo-100"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar >
  );
}
