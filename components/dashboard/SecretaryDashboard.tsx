import { type FC } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Instance = any;

interface Props {
  activeSemesterLabel: string | null;
  facultyCount: number;
  organizationCount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upcomingInstances: any[];
  overdueCount: number;
  pendingSecretary: number;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - new Date(new Date().toDateString()).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

const SecretaryDashboard: FC<Props> = ({
  activeSemesterLabel,
  facultyCount,
  organizationCount,
  upcomingInstances,
  overdueCount,
  pendingSecretary,
}) => {
  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-label">Faculty</p>
          <p className="stat-value">{facultyCount}</p>
        </div>
        <div className="stat-card orange">
          <p className="stat-label">Pending Compliance Check</p>
          <p className="stat-value orange">{pendingSecretary}</p>
        </div>
        <div className="stat-card red">
          <p className="stat-label">Overdue Instances</p>
          <p className="stat-value red">{overdueCount}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Due Within 14 Days</p>
          <p className="stat-value">{upcomingInstances.length}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="section-title">Deadline Tracker</h3>
        <p style={{ margin: "-8px 0 16px", fontSize: 13, color: "#9ca3af" }}>
          {activeSemesterLabel ?? "No active semester"}
        </p>
        {upcomingInstances.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>Nothing due in the next 14 days.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Category</th>
                  <th>Due Date</th>
                  <th>Days Left</th>
                </tr>
              </thead>
              <tbody>
                {upcomingInstances.map((i: Instance) => {
                  const left = daysUntil(i.due_date);
                  return (
                    <tr key={i.id}>
                      <td>{i.requirement_templates?.name}</td>
                      <td style={{ color: "#6b7280" }}>{i.requirement_templates?.requirement_categories?.name ?? "—"}</td>
                      <td>{i.due_date ?? "—"}</td>
                      <td>
                        <span className={`badge ${left !== null && left <= 3 ? "badge-red" : "badge-gray"}`}>
                          {left === null ? "—" : left < 0 ? `${Math.abs(left)}d overdue` : `${left}d`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <a href="/submissions/review" className="btn btn-primary btn-sm">
        → Review Queue ({pendingSecretary} pending)
      </a>

      <p style={{ margin: "20px 0 0", fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>
        Reminders, Calendar of Activities, and Resource Library management land with Phase 5.
      </p>
    </div>
  );
};

export default SecretaryDashboard;