import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/auth/permissions";
import AppShell from "@/components/AppShell";

const WORKFLOW_STEPS = ["Coordinator", "Records", "Secretary", "Chair"];

const STATUS_CONFIG = {
  draft: { class: "badge badge-gray", label: "Pending" },
  submitted: { class: "badge badge-blue", label: "Under Review" },
  needs_revision: { class: "badge badge-red", label: "Returned" },
  completed: { class: "badge badge-green", label: "Approved" },
};

export default async function ComplianceMatrixPage() {
  const supabase = await createClient();
  const { user, role, profile } = await getCurrentUserAccess(supabase);
  if (!user) redirect("/login");

  const { data: activeSemester } = await supabase
    .from("semesters")
    .select("id, name, academic_years ( label )")
    .eq("is_active", true)
    .single();

  const { data: instances } = activeSemester
    ? await supabase.from("requirement_instances")
        .select("id, requirement_templates ( id, name, category_id, requirement_categories ( id, name ) )")
        .eq("semester_id", activeSemester.id)
    : { data: [] };

  const sortedInstances = [...(instances ?? [])].sort((a, b) => {
    const catA = a.requirement_templates?.requirement_categories?.id ?? 0;
    const catB = b.requirement_templates?.requirement_categories?.id ?? 0;
    if (catA !== catB) return catA - catB;
    return (a.requirement_templates?.id ?? 0) - (b.requirement_templates?.id ?? 0);
  });

  // Scope faculty list for coordinators
  let scopedFacultyIds = [];
  if (role === "Coordinator") {
    const { data: progCoords } = await supabase
      .from("program_coordinators")
      .select("program_id")
      .eq("user_id", user.id);
    const progIds = (progCoords ?? []).map((pc) => pc.program_id).filter(Boolean);
    const isDeptWide = (progCoords ?? []).some((pc) => pc.program_id === null);
    if (progIds.length > 0 && !isDeptWide) {
      const { data: facProfiles } = await supabase
        .from("faculty_profiles")
        .select("user_id")
        .in("program_id", progIds);
      scopedFacultyIds = (facProfiles ?? []).map((fp) => fp.user_id);
    }
  }

  let facultyQuery = supabase
    .from("users")
    .select("id, full_name, roles!role_id!inner(name)")
    .eq("roles.name", "Faculty");

  if (scopedFacultyIds.length > 0) {
    facultyQuery = facultyQuery.in("id", scopedFacultyIds);
  }

  const { data: faculty } = await facultyQuery.order("full_name");

  const instanceIds = sortedInstances.map((i) => i.id);

  const { data: assignments } = instanceIds.length
    ? await supabase
        .from("assignments")
        .select("requirement_instance_id, faculty_id, submissions ( id, status, current_step, updated_at )")
        .in("requirement_instance_id", instanceIds)
        .not("faculty_id", "is", null)
    : { data: [] };

  const submissionMap = {};
  for (const a of assignments ?? []) {
    submissionMap[`${a.faculty_id}-${a.requirement_instance_id}`] = a.submissions?.[0] ?? null;
  }

  const categoryGroups = [];
  for (const inst of sortedInstances) {
    const catName = inst.requirement_templates?.requirement_categories?.name ?? "Uncategorized";
    const last = categoryGroups[categoryGroups.length - 1];
    if (last && last.name === catName) last.instances.push(inst);
    else categoryGroups.push({ name: catName, instances: [inst] });
  }

  return (
    <AppShell fullName={profile?.full_name} email={user.email} role={role} currentPath="/requirements/compliance-matrix">
      <div className="page-header">
        <h1>Compliance Matrix</h1>
        <p>
          {activeSemester
            ? `${activeSemester.academic_years?.label} · ${activeSemester.name}`
            : "No active semester set"}
        </p>
      </div>
      <div className="page-body">
        {/* Workflow pipeline indicator */}
        <div className="card" style={{ padding: "16px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: "#374151", marginRight: 8 }}>Workflow:</span>
            {WORKFLOW_STEPS.map((step, i) => (
              <span key={step} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="badge badge-blue" style={{ padding: "4px 12px" }}>{step}</span>
                {i < WORKFLOW_STEPS.length - 1 && <span style={{ color: "#d1d5db" }}>→</span>}
              </span>
            ))}
            <span style={{ marginLeft: 8, color: "#9ca3af" }}>then <span className="badge badge-green">Completed</span></span>
          </div>
        </div>

        {!activeSemester && <div className="card" style={{ textAlign: "center" }}><p style={{ color: "#9ca3af" }}>Set an active academic year and semester first.</p></div>}
        {activeSemester && sortedInstances.length === 0 && (
          <div className="card" style={{ textAlign: "center" }}><p style={{ color: "#9ca3af" }}>No requirement instances yet. Go to Requirements and click &ldquo;Generate all instances.&rdquo;</p></div>
        )}
        {activeSemester && sortedInstances.length > 0 && (faculty ?? []).length === 0 && (
          <div className="card" style={{ textAlign: "center" }}><p style={{ color: "#9ca3af" }}>No faculty accounts yet.</p></div>
        )}

        {activeSemester && sortedInstances.length > 0 && (faculty ?? []).length > 0 && (
          <div className="table-wrap" style={{ overflow: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th style={{ position: "sticky", left: 0, background: "#f9fafb", zIndex: 10, minWidth: 180 }}>Name of Faculty</th>
                  {categoryGroups.map((g) => (
                    <th key={g.name} colSpan={g.instances.length} style={{ textAlign: "center", background: "#f3f4f6", color: "#374151", fontSize: 12, borderLeft: "2px solid #e5e7eb" }}>
                      {g.name}
                    </th>
                  ))}
                </tr>
                <tr>
                  {categoryGroups.map((g) =>
                    g.instances.map((inst, idx) => (
                      <th key={inst.id} style={{ minWidth: 130, fontWeight: 500, fontSize: 12, color: "#6b7280", borderLeft: idx === 0 ? "2px solid #e5e7eb" : undefined }}>
                        {inst.requirement_templates?.name}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {(faculty ?? []).map((f) => (
                  <tr key={f.id}>
                    <td style={{ position: "sticky", left: 0, background: "white", zIndex: 5, fontWeight: 500, borderRight: "1px solid #e5e7eb" }}>
                      {f.full_name}
                    </td>
                    {sortedInstances.map((inst) => {
                      const sub = submissionMap[`${f.id}-${inst.id}`];
                      if (!sub) return <td key={inst.id}><span className="badge badge-gray" style={{ opacity: 0.4 }}>N/A</span></td>;

                      const cfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.draft;
                      const step = sub.current_step < 4 ? WORKFLOW_STEPS[sub.current_step] : null;

                      return (
                        <td key={inst.id}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <span className={cfg.class}>{cfg.label}</span>
                            {sub.status === "submitted" && step && (
                              <span style={{ fontSize: 10, color: "#9ca3af" }}>@{step}</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>Status:</span>
          <span className="badge badge-gray">Pending</span>
          <span className="badge badge-blue">Under Review</span>
          <span className="badge badge-red">Returned</span>
          <span className="badge badge-green">Approved</span>
          <span className="badge badge-gray" style={{ opacity: 0.4 }}>N/A Not assigned</span>
          <a href="/submissions" className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }}>Go to Submissions</a>
          <a href="/requirements/compliance-matrix/export" className="btn btn-secondary btn-sm">Export CSV</a>
        </div>
      </div>
    </AppShell>
  );
}
