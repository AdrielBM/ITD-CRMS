import { logoutAction } from "@/app/(auth)/actions";
import {
  LayoutDashboard,
  Users,
  FileText,
  Table,
  Upload,
  CheckCircle,
  GraduationCap,
  UserPlus,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/faculty", label: "Faculty", icon: Users },
  { href: "/requirements", label: "Requirements", icon: FileText },
  { href: "/requirements/compliance-matrix", label: "Compliance Matrix", icon: Table },
  { href: "/submissions", label: "My Submissions", icon: Upload },
];

const REVIEW_LINKS = [
  { href: "/submissions/review", label: "Review Queue", icon: CheckCircle },
];

const SETTINGS_LINKS = [
  { href: "/settings/academic", label: "Academic Structure", icon: GraduationCap },
];

export default function Sidebar({ fullName, email, role, currentPath }) {
  const isReviewer = ["Chair", "Secretary", "Records", "Coordinator"].includes(role);

  function isActive(href) {
    if (href === "/dashboard") return currentPath === "/dashboard";
    return currentPath.startsWith(href);
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-brand">ITD-CRMS</h1>
        <p className="sidebar-sub">Compliance & Requirements</p>
      </div>

      <div className="sidebar-user">
        <p className="sidebar-user-name">{fullName ?? email}</p>
        <p className="sidebar-user-role">{role ?? "No role"}</p>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`sidebar-link${isActive(item.href) ? " active" : ""}`}
            >
              <Icon size={18} />
              {item.label}
            </a>
          );
        })}

        {isReviewer && (
          <>
            <div style={{ padding: "16px 20px 6px", fontSize: 11, color: "#a5d6a7", textTransform: "uppercase", letterSpacing: "1px" }}>
              Reviews
            </div>
            {REVIEW_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link${isActive(item.href) ? " active" : ""}`}
                >
                  <Icon size={18} />
                  {item.label}
                </a>
              );
            })}
          </>
        )}

        <div style={{ padding: "16px 20px 6px", fontSize: 11, color: "#a5d6a7", textTransform: "uppercase", letterSpacing: "1px" }}>
          Settings
        </div>
        {SETTINGS_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`sidebar-link${isActive(item.href) ? " active" : ""}`}
            >
              <Icon size={18} />
              {item.label}
            </a>
          );
        })}

        {role === "Chair" && (
          <a
            href="/admin/create-account"
            className={`sidebar-link${isActive("/admin/create-account") ? " active" : ""}`}
          >
            <UserPlus size={18} />
            Create Account
          </a>
        )}
      </nav>

      <div className="sidebar-footer">
        <form action={logoutAction}>
          <button type="submit" className="sidebar-link" style={{ width: "100%", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>
            <LogOut size={18} />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
