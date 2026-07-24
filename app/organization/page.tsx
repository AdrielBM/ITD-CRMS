import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/auth/permissions";
import AppShell from "@/components/AppShell";

const STATUS_CLASS: Record<string, string> = {
  draft: "badge badge-gray", submitted: "badge badge-blue",
  needs_revision: "badge badge-red", completed: "badge badge-green",
};
const STATUS_LABEL: Record<string, string> = {
  draft: "Pending", submitted: "Submitted",
  needs_revision: "Returned", completed: "Approved",
};

export default async function OrganizationPage() {
  const supabase = await createClient();
  const { user, roles, profile } = await getCurrentUserAccess(supabase);
  if (!user) redirect("/login");
  if (!roles?.includes("Student Org Leader")) redirect("/dashboard");

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, acronym, program_id, adviser_id")
    .eq("org_leader_id", user.id)
    .single();

  if (!org) {
    return (
<AppShell fullName={profile?.full_name} email={user.email} role={roles[0] ?? "Student Org Leader"} roles={roles} currentPath="/organization">
        <div className="page-header">
          <h1>My Organization</h1>
          <p>Student Org Leader</p>
        </div>
        <div className="page-body">
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <p style={{ color: "#9ca3af", margin: 0 }}>You are not linked to any organization yet. Contact the Department Chair.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const { data: activeSemester } = await supabase
    .from("semesters")
    .select("id, name, academic_years ( label )")
    .eq("is_active", true)
    .single();

  const { data: instances } = activeSemester
    ? await supabase
        .from("requirement_instances")
        .select("id, due_date, requirement_templates ( id, name, requirement_categories ( name ) )")
        .eq("semester_id", activeSemester.id)
    : { data: [] };

  const instanceIds = (instances ?? []).map((i: any) => i.id);
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, full_name")
    .order("full_name");

  const userMap: Record<string, string> = {};
  for (const u of allUsers ?? []) userMap[u.id] = u.full_name;

  const { data: assignments } = instanceIds.length
    ? await supabase
        .from("assignments")
        .select("id, requirement_instance_id, faculty_id, submissions ( id, status, current_step, updated_at )")
        .in("requirement_instance_id", instanceIds)
    : { data: [] };

  const statusCounts: Record<string, number> = { draft: 0, submitted: 0, needs_revision: 0, completed: 0 };
  for (const a of assignments ?? []) {
    const st = a.submissions?.[0]?.status ?? "draft";
    statusCounts[st]++;
  }
  const totalAssignments = (assignments ?? []).length;
  const completionPct = totalAssignments > 0 ? Math.round((statusCounts.completed / totalAssignments) * 100) : 0;

  const groups: { name: string; instances: any[] }[] = [];
  for (const inst of instances ?? []) {
    const catName = inst.requirement_templates?.requirement_categories?.name ?? "Uncategorized";
    const last = groups[groups.length - 1];
    if (last && last.name === catName) last.instances.push(inst);
    else groups.push({ name: catName, instances: [inst] });
  }

  return (
    <AppShell fullName={profile?.full_name} email={user.email} role={roles[0] ?? "Student Org Leader"} roles={roles} currentPath="/organization">
      <div className="page-header">
        <h1>{org.name}</h1>
        <p>{org.acronym ? `${org.acronym} \u00b7 ` : ""}Student Organization Compliance</p>
      </div>
      <div className="page-body">
        <div className="stat-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card green">
            <p className="stat-label">Compliance Rate</p>
            <p className="stat-value green">{completionPct}%</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Total Assigned</p>
            <p className="stat-value">{totalAssignments}</p>
          </div>
          <div className="stat-card orange">
            <p className="stat-label">Under Review</p>
            <p className="stat-value orange">{statusCounts.submitted}</p>
          </div>
          <div className="stat-card red">
            <p className="stat-label">Returned</p>
            <p className="stat-value red">{statusCounts.needs_revision}</p>
          </div>
        </div>

        {!activeSemester && (
          <div className="card" style={{ textAlign: "center" }}><p style={{ color: "#9ca3af" }}>No active semester.</p></div>
        )}

        {activeSemester && groups.map((g) => (
          <div key={g.name} className="card" style={{ marginBottom: 20 }}>
            <h3 className="section-title">{g.name}</h3>
            <div className="table-wrap" style={{ border: "none", borderRadius: 0, boxShadow: "none", padding: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Faculty</th>
                    <th>Status</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {g.instances.map((inst: any) => {
                    const instAssignments = (assignments ?? []).filter(
                      (a: any) => a.requirement_instance_id === inst.id
                    );
                    return instAssignments.length === 0 ? (
                      <tr key={inst.id}>
                        <td>{inst.requirement_templates?.name}</td>
                        <td colSpan={3} style={{ color: "#9ca3af", fontSize: 13 }}>No faculty assignments</td>
                      </tr>
                    ) : (
                      instAssignments.map((a: any) => {
                        const sub = a.submissions?.[0];
                        const st = sub?.status ?? "draft";
                        return (
                          <tr key={a.id}>
                            <td style={{ fontWeight: 500 }}>{inst.requirement_templates?.name}</td>
                            <td>{userMap[a.faculty_id] ?? "\u2014"}</td>
                            <td><span className={STATUS_CLASS[st]}>{STATUS_LABEL[st]}</span></td>
                            <td style={{ fontSize: 13, color: "#6b7280" }}>{inst.due_date ?? "\u2014"}</td>
                          </tr>
                        );
                      })
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}