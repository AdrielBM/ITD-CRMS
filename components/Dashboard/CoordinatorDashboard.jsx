export default function CoordinatorDashboard({ activeSemesterLabel, facultyCount, instances, pendingCoordinator }) {
  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card orange">
          <p className="stat-label">Pending Reviews</p>
          <p className="stat-value orange">{pendingCoordinator}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Faculty (All Programs)</p>
          <p className="stat-value">{facultyCount}</p>
          <p className="stat-hint">Not yet scoped by program</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Requirement Instances</p>
          <p className="stat-value">{instances.length}</p>
          <p className="stat-hint">{activeSemesterLabel ?? "No active semester"}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Returned This Week</p>
          <p className="stat-value" style={{ color: "#9ca3af" }}>—</p>
          <p className="stat-hint">Needs Phase 4</p>
        </div>
      </div>

      <div className="card-orange" style={{ marginBottom: 20, fontSize: 14, color: "#9a3412" }}>
        This account role is currently shared by IT and CS Coordinators — the system doesn&rsquo;t yet scope submissions or faculty lists to a single program.
      </div>

      <a href="/submissions/review" className="btn btn-primary btn-sm" style={{ marginBottom: 24, display: "inline-flex" }}>
        → Review Queue ({pendingCoordinator} pending)
      </a>

      <div className="card">
        <h3 className="section-title">Requirement Instances This Semester</h3>
        {instances.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>No requirement instances generated yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Category</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {instances.map((i) => (
                  <tr key={i.id}>
                    <td>{i.requirement_templates?.name}</td>
                    <td style={{ color: "#6b7280" }}>{i.requirement_templates?.requirement_categories?.name ?? "—"}</td>
                    <td>{i.due_date ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
