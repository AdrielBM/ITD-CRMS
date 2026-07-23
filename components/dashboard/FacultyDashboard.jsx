"use client";

import {
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";

const PIE_COLORS = {
  completed: "#16a34a",
  submitted: "#ea580c",
  needs_revision: "#dc2626",
  draft: "#9ca3af",
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date(new Date().toDateString());
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

const STATUS_CLASS = {
  draft: "badge badge-gray",
  submitted: "badge badge-blue",
  needs_revision: "badge badge-red",
  completed: "badge badge-green",
};

const STATUS_LABEL = {
  draft: "Pending",
  submitted: "Submitted",
  needs_revision: "Returned",
  completed: "Approved",
};

export default function FacultyDashboard({
  activeSemesterLabel,
  myAssignments,
  submissionStatuses,
  completedCount,
  returnedCount,
}) {
  const overdue = myAssignments.filter((a) => {
    const left = daysUntil(a.requirement_instances?.due_date);
    return left !== null && left < 0;
  });

  const statusMap = {};
  for (const s of submissionStatuses ?? []) statusMap[s.assignment_id] = s;

  const statusCounts = { draft: 0, submitted: 0, needs_revision: 0, completed: 0 };
  for (const a of myAssignments) {
    const st = statusMap[a.id]?.status ?? "draft";
    statusCounts[st]++;
  }

  const pieData = Object.entries(statusCounts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: STATUS_LABEL[k] || k, value: v, color: PIE_COLORS[k] }));

  const totalAssigned = myAssignments.length;
  const completionPct = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

  const groups = [];
  for (const a of myAssignments) {
    const catName = a.requirement_instances?.requirement_templates?.requirement_categories?.name ?? "Uncategorized";
    const existing = groups.find((g) => g.name === catName);
    if (existing) existing.items.push(a);
    else groups.push({ name: catName, items: [a] });
  }

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-label">My Requirements</p>
          <p className="stat-value">{totalAssigned}</p>
        </div>
        <div className="stat-card green">
          <p className="stat-label">Approved</p>
          <p className="stat-value green">{completedCount}</p>
        </div>
        <div className="stat-card red">
          <p className="stat-label">Returned</p>
          <p className="stat-value red">{returnedCount}</p>
        </div>
        <div className="stat-card orange">
          <p className="stat-label">Overdue</p>
          <p className="stat-value orange">{overdue.length}</p>
        </div>
      </div>

      {pieData.length > 0 && (
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <h3 className="section-title">My Progress</h3>
            <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                    paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h3 className="section-title">Completion Rate</h3>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ fontSize: 48, fontWeight: 700, color: completionPct >= 80 ? "#16a34a" : completionPct >= 50 ? "#ea580c" : "#dc2626", margin: 0 }}>
                {completionPct}%
              </p>
              <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>
                {completedCount} of {totalAssigned} requirements approved
              </p>
            </div>
          </div>
        </div>
      )}

      <a href="/submissions" className="btn btn-primary btn-sm" style={{ marginBottom: 24, display: "inline-flex" }}>
        → My Submissions
      </a>

      {groups.length === 0 ? (
        <div className="card" style={{ textAlign: "center" }}>
          <p style={{ color: "#9ca3af" }}>Nothing assigned to you yet this semester.</p>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.name} className="card" style={{ marginBottom: 20 }}>
            <h3 className="section-title">{g.name}</h3>
            <div>
              {g.items.map((a) => {
                const left = daysUntil(a.requirement_instances?.due_date);
                const isOverdue = left !== null && left < 0;
                const sub = statusMap[a.id];
                const subStatus = sub?.status ?? "draft";

                return (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <span style={{ fontWeight: 500, color: "#1f2937" }}>
                      {a.requirement_instances?.requirement_templates?.name}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, color: "#9ca3af" }}>
                        {a.requirement_instances?.due_date ?? "No due date"}
                      </span>
                      <span className={STATUS_CLASS[subStatus] ?? "badge badge-gray"}>
                        {STATUS_LABEL[subStatus] ?? "Pending"}
                      </span>
                      {isOverdue && subStatus === "draft" && (
                        <span className="badge badge-red">Overdue</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
