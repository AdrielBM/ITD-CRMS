"use client";

import { useEffect, useState } from "react";
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
  Settings,
  Bell,
  Building2,
  Trash2,
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
  const [unreadCount, setUnreadCount] = useState(0);
  const isReviewer = ["Chair", "Secretary", "Records", "Coordinator"].includes(role);

  useEffect(() => {
    fetch("/api/unread-count").then((r) => r.json()).then((d) => setUnreadCount(d.count ?? 0)).catch(() => {});
  }, []);

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

        <a
          href="/notifications"
          className={`sidebar-link${isActive("/notifications") ? " active" : ""}`}
        >
          <div style={{ position: "relative" }}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: -6, right: -6,
                background: "#ea580c", color: "white", fontSize: 10,
                borderRadius: "50%", width: 16, height: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, lineHeight: 1,
              }}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          Notifications
        </a>

        {isReviewer && (
          <>
            <div className="sidebar-section-label">
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

        <div className="sidebar-section-label">
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

        {role === "Student Org Leader" && (
          <a
            href="/organization"
            className={`sidebar-link${isActive("/organization") ? " active" : ""}`}
          >
            <Building2 size={18} />
            My Organization
          </a>
        )}

        {role === "Chair" && (
          <>
            <div className="sidebar-section-label">
              Administration
            </div>
            <a
              href="/admin/users"
              className={`sidebar-link${isActive("/admin/users") ? " active" : ""}`}
            >
              <Settings size={18} />
              User Management
            </a>
            <a
              href="/admin/organizations"
              className={`sidebar-link${isActive("/admin/organizations") ? " active" : ""}`}
            >
              <Building2 size={18} />
              Organizations
            </a>
            <a
              href="/admin/activity"
              className={`sidebar-link${isActive("/admin/activity") ? " active" : ""}`}
            >
              <FileText size={18} />
              Activity Log
            </a>
            <a
              href="/admin/recycle"
              className={`sidebar-link${isActive("/admin/recycle") ? " active" : ""}`}
            >
              <Trash2 size={18} />
              Recycle Bin
            </a>
            <a
              href="/admin/seed"
              className={`sidebar-link${isActive("/admin/seed") ? " active" : ""}`}
            >
              <Upload size={18} />
              Seed Data
            </a>
            <a
              href="/admin/create-account"
              className={`sidebar-link${isActive("/admin/create-account") ? " active" : ""}`}
            >
              <UserPlus size={18} />
              Create Account
            </a>
          </>
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
