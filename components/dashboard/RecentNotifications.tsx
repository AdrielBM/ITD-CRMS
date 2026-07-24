"use client";

import { type FC } from "react";
import { Bell, CheckCircle, AlertTriangle, RefreshCw, Upload, type LucideIcon } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Notification = any;

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notifications: any[];
}

const ICON_MAP: Record<string, { icon: LucideIcon; color: string }> = {
  submission_submitted: { icon: Upload, color: "#ea580c" },
  submission_approved: { icon: CheckCircle, color: "#16a34a" },
  submission_completed: { icon: CheckCircle, color: "#16a34a" },
  submission_needs_revision: { icon: AlertTriangle, color: "#dc2626" },
  submission_rejected: { icon: AlertTriangle, color: "#dc2626" },
};

const TYPE_LABEL: Record<string, string> = {
  submission_submitted: "Submitted",
  submission_approved: "Approved",
  submission_completed: "Completed",
  submission_needs_revision: "Needs Revision",
  submission_rejected: "Rejected",
};

const RecentNotifications: FC<Props> = ({ notifications }) => {
  if (!notifications?.length) return null;

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 className="section-title" style={{ margin: 0 }}>Recent Notifications</h3>
        <a href="/notifications" style={{ fontSize: 13, color: "#ea580c", fontWeight: 500 }}>View all →</a>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {notifications.slice(0, 5).map((n: Notification) => {
          const cfg = ICON_MAP[n.type] ?? { icon: Bell, color: "#6b7280" };
          const Icon = cfg.icon;
          return (
            <div key={n.id} style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "10px 12px", borderRadius: 8,
              background: n.read_at ? "transparent" : "#f0fdf4",
              transition: "background 0.15s",
            }}>
              <Icon size={16} style={{ color: cfg.color, marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: n.read_at ? 400 : 600, color: "#1f2937" }}>
                  {n.title}
                </div>
                {n.body && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {n.body}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>
                {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentNotifications;