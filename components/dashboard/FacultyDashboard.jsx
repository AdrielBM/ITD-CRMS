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
          <p className="stat-value">{myAssignments.length}</p>
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
