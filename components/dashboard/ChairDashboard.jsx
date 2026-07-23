"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#16a34a", "#ea580c", "#dc2626", "#9ca3af"];

export default function ChairDashboard({
  activeSemesterLabel,
  facultyCount,
  organizationCount,
  instanceCount,
  assignmentCount,
  recentUsers,
  pendingChair,
  categoryData,
}) {
  const barData = (categoryData ?? []).map((c) => ({
    name: c.name,
    Approved: c.completed,
    Submitted: c.submitted,
    Returned: c.needs_revision,
    Pending: c.draft,
  }));

  const pieData = [
    { name: "Approved", value: barData.reduce((s, c) => s + c.Approved, 0), color: "#16a34a" },
    { name: "Submitted", value: barData.reduce((s, c) => s + c.Submitted, 0), color: "#ea580c" },
    { name: "Returned", value: barData.reduce((s, c) => s + c.Returned, 0), color: "#dc2626" },
    { name: "Pending", value: barData.reduce((s, c) => s + c.Pending, 0), color: "#9ca3af" },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card green">
          <p className="stat-label">Faculty</p>
          <p className="stat-value green">{facultyCount}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Requirement Instances</p>
          <p className="stat-value">{instanceCount}</p>
          <p className="stat-hint">{activeSemesterLabel ?? "No active semester"}</p>
        </div>
        <div className="stat-card orange">
          <p className="stat-label">Pending Final Approval</p>
          <p className="stat-value orange">{pendingChair}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Assignments</p>
          <p className="stat-value">{assignmentCount}</p>
        </div>
      </div>

      {barData.length > 0 && (
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <h3 className="section-title">Submissions by Category</h3>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 16, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="Approved" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Submitted" fill="#ea580c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Returned" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pending" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <h3 className="section-title">Overall Completion</h3>
            <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                      paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: "#9ca3af" }}>No data yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3 className="section-title">Quick Actions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <a href="/submissions/review" className="btn btn-primary btn-sm" style={{ justifyContent: "flex-start", background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
              → Review Queue ({pendingChair} pending)
            </a>
            <a href="/admin/users" className="btn btn-outline btn-sm" style={{ justifyContent: "flex-start" }}>
              → User Management
            </a>
            <a href="/requirements" className="btn btn-outline btn-sm" style={{ justifyContent: "flex-start" }}>
              → Manage Requirements
            </a>
            <a href="/requirements/compliance-matrix" className="btn btn-outline btn-sm" style={{ justifyContent: "flex-start" }}>
              → Compliance Matrix
            </a>
            <a href="/settings/academic" className="btn btn-outline btn-sm" style={{ justifyContent: "flex-start" }}>
              → Academic Structure
            </a>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">Recently Created Accounts</h3>
          {recentUsers.length === 0 ? (
            <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>No accounts created yet.</p>
          ) : (
            <div>
              {recentUsers.map((u) => (
                <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6", fontSize: 14 }}>
                  <span style={{ color: "#1f2937" }}>{u.full_name}</span>
                  <span className="badge badge-gray">{u.roles?.name ?? "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
