import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/auth/permissions";
import AppShell from "@/components/AppShell";
import { markAsRead, markAllAsRead } from "./actions";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TYPE_COLORS = {
  submission_submitted: "badge-blue",
  submission_approved: "badge-green",
  submission_rejected: "badge-red",
  submission_needs_revision: "badge-orange",
  submission_completed: "badge-green",
};

const TYPE_LABELS = {
  submission_submitted: "Submitted",
  submission_approved: "Approved",
  submission_rejected: "Rejected",
  submission_needs_revision: "Needs Revision",
  submission_completed: "Completed",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { user, role, roles, profile } = await getCurrentUserAccess(supabase);
  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const unreadCount = (notifications ?? []).filter((n) => !n.is_read).length;

  return (
    <AppShell fullName={profile?.full_name} email={user.email} role={role} roles={roles} currentPath="/notifications">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount > 0 ? `${unreadCount} unread` : "No unread notifications"}</p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllAsRead}>
            <button className="btn btn-outline btn-sm">Mark all as read</button>
          </form>
        )}
      </div>
      <div className="page-body">
        {(notifications ?? []).length === 0 && (
          <div className="empty-state" style={{ padding: "60px 20px", textAlign: "center", color: "#9ca3af" }}>
            No notifications yet. They appear when submissions are submitted, approved, or rejected.
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {(notifications ?? []).map((n) => (
            <div key={n.id} className="card" style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
              borderLeft: n.is_read ? "3px solid transparent" : "3px solid #ea580c",
              background: n.is_read ? "white" : "#fffcf5",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span className={`badge ${TYPE_COLORS[n.type] || "badge-gray"}`} style={{ fontSize: 11 }}>
                    {TYPE_LABELS[n.type] || n.type}
                  </span>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>{timeAgo(n.created_at)}</span>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: n.is_read ? 400 : 500 }}>
                  {n.title}
                </p>
                {n.body && <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>{n.body}</p>}
              </div>
              {!n.is_read && (
                <form action={markAsRead}>
                  <input type="hidden" name="notification_id" value={n.id} />
                  <button className="btn btn-outline btn-sm" style={{ whiteSpace: "nowrap" }}>Dismiss</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
