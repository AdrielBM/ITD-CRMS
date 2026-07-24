import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/auth/permissions";
import AppShell from "@/components/AppShell";
import MatrixTable from "@/components/MatrixTable";

const WORKFLOW_STEPS: Array<{ label: string; roles: string[] }> = [
  { label: "IT / CS Coordinator", roles: ["IT Coordinator", "CS Coordinator", "Coordinator"] },
  { label: "Records", roles: ["Records"] },
  { label: "Secretary", roles: ["Secretary"] },
  { label: "Chair", roles: ["Chair"] },
];

export default async function ComplianceMatrixPage() {
  const supabase = await createClient();
  const { user, role, roles, profile } = await getCurrentUserAccess(supabase);
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

  const sortedInstances = [...(instances ?? [])].sort((a: any, b: any) => {
    const catA = a.requirement_templates?.requirement_categories?.id ?? 0;
    const catB = b.requirement_templates?.requirement_categories?.id ?? 0;
    if (catA !== catB) return catA - catB;
    return (a.requirement_templates?.id ?? 0) - (b.requirement_templates?.id ?? 0);
  });

  // Scope faculty list for coordinators
  let scopedFacultyIds: any[] = [];
  if (roles.some((r: string) => ["IT Coordinator", "CS Coordinator", "Coordinator"].includes(r))) {
    const { data: progCoords } = await supabase
      .from("program_coordinators")
      .select("program_id")
      .eq("user_id", user.id);
    const progIds = (progCoords ?? []).map((pc: any) => pc.program_id).filter(Boolean);
    const isDeptWide = (progCoords ?? []).some((pc: any) => pc.program_id === null);
    if (progIds.length > 0 && !isDeptWide) {
      const { data: facProfiles } = await supabase
        .from("faculty_profiles")
        .select("user_id")
        .in("program_id", progIds);
      scopedFacultyIds = (facProfiles ?? []).map((fp: any) => fp.user_id);
    }
  }

  let facultyQuery: any = supabase
    .from("users")
    .select("id, full_name, roles!role_id!inner(name)")
    .eq("roles.name", "Faculty");

  if (scopedFacultyIds.length > 0) {
    facultyQuery = facultyQuery.in("id", scopedFacultyIds);
  }

  const { data: faculty } = await facultyQuery.order("full_name");

  const instanceIds = sortedInstances.map((i: any) => i.id);

  const { data: assignments } = instanceIds.length
    ? await supabase
        .from("assignments")
        .select("requirement_instance_id, faculty_id, submissions ( id, status, current_step, updated_at )")
        .in("requirement_instance_id", instanceIds)
        .not("faculty_id", "is", null)
    : { data: [] };

  const submissionMap: Record<string, any> = {};
  for (const a of assignments ?? []) {
    submissionMap[`${a.faculty_id}-${a.requirement_instance_id}`] = a.submissions?.[0] ?? null;
  }

  const categoryGroups: Array<{ name: string; instances: any[] }> = [];
  for (const inst of sortedInstances) {
    const catName = inst.requirement_templates?.requirement_categories?.name ?? "Uncategorized";
    const last = categoryGroups[categoryGroups.length - 1];
    if (last && last.name === catName) last.instances.push(inst);
    else categoryGroups.push({ name: catName, instances: [inst] });
  }

  return (
    <AppShell fullName={profile?.full_name} email={user.email} role={role} roles={roles} currentPath="/requirements/compliance-matrix">
      <div className="page-header">
        <h1>Compliance Matrix</h1>
        <p>
          {activeSemester
            ? `${(activeSemester.academic_years as any)?.label} · ${activeSemester.name}`
            : "No active semester set"}
        </p>
      </div>
      <div className="page-body">
        {/* Workflow pipeline indicator */}
        <div className="card" style={{ padding: "16px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: "#374151", marginRight: 8 }}>Workflow:</span>
            {WORKFLOW_STEPS.map((step, i) => (
              <span key={step.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={`badge ${roles.some((r: string) => step.roles.includes(r)) ? "badge-blue" : "badge-gray"}`} style={{ padding: "4px 12px" }}>{step.label}</span>
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
          <MatrixTable faculty={faculty} sortedInstances={sortedInstances} submissionMap={submissionMap} categoryGroups={categoryGroups} />
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
