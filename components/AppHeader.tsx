import { logoutAction } from "@/app/(auth)/actions";
import { type FC } from "react";

interface NavItem {
  href: string;
  label: string;
  reviewerOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/faculty", label: "Faculty" },
  { href: "/organizations", label: "Organizations" },
  { href: "/requirements", label: "Requirements" },
  { href: "/requirements/compliance-matrix", label: "Compliance Matrix" },
  { href: "/submissions", label: "My Submissions" },
  { href: "/submissions/review", label: "Review Queue", reviewerOnly: true },
  { href: "/settings/academic", label: "Academic structure" },
];

interface Props {
  fullName: string | null;
  email: string | null;
  role: string | null;
}

const AppHeader: FC<Props> = ({ fullName, email, role }) => {
  return (
    <header
      style={{
        background: "#333",
        color: "white",
        borderBottom: "3px solid #555",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "0.5px" }}>
            ITD-CRMS
          </span>
          <nav style={{ display: "flex", gap: 20, fontSize: 14 }}>
              {NAV.map((item) => {
              if (item.reviewerOnly && !["Chair","Secretary","Records","Coordinator"].includes(role ?? "")) return null;
              return (
                <a key={item.href} href={item.href} className="nav-link">
                  {item.label}
                </a>
              );
            })}
            {role === "Chair" && (
              <a
                href="/admin/create-account"
                className="nav-link"
              >
                Create account
              </a>
            )}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 14, color: "white" }}>
              {fullName ?? email}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#aaa" }}>
              {role ?? "No role"}
            </p>
          </div>
          <form action={logoutAction}>
            <button className="header-signout-btn">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;