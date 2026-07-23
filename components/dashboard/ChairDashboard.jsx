export default function ChairDashboard({
  activeSemesterLabel,
  facultyCount,
  organizationCount,
  instanceCount,
  assignmentCount,
  recentUsers,
  pendingChair,
}) {
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

      <div className="grid-2">
        <div className="card">
          <h3 className="section-title">Quick Actions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <a href="/submissions/review" className="btn btn-primary btn-sm" style={{ justifyContent: "flex-start", background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
              → Review Queue ({pendingChair} pending)
            </a>
            <a href="/admin/create-account" className="btn btn-outline btn-sm" style={{ justifyContent: "flex-start" }}>
              → Create Account
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

      <p style={{ margin: "20px 0 0", fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>
        Department-wide compliance analytics and Recycle Bin will populate here once fully built.
      </p>
    </div>
  );
}
