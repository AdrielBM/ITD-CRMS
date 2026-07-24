import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/auth/permissions";
import AppShell from "@/components/AppShell";
import { approveSubmission, rejectSubmission } from "../actions";

const WORKFLOW_STEPS: Array<{ step: number; roles: string[]; label: string }> = [
  { step: 0, roles: ["IT Coordinator", "CS Coordinator", "Coordinator"], label: "Coordinator Review" },
  { step: 1, roles: ["Records"], label: "Records Verification" },
  { step: 2, roles: ["Secretary"], label: "Secretary Compliance" },
  { step: 3, roles: ["Chair"], label: "Chair Final Approval" },
];

export default async function ReviewQueuePage() {
  const supabase = await createClient();
  const { user, role, roles, profile } = await getCurrentUserAccess(supabase);
  if (!user) redirect("/login");

  const isReviewer = ["IT Coordinator", "CS Coordinator", "Coordinator", "Records", "Secretary", "Chair"].some((r) => roles.includes(r));
  if (!isReviewer) redirect("/dashboard");

  const mySteps = WORKFLOW_STEPS.filter((s) => s.roles.some((r) => roles.includes(r)));
  const stepLabel = mySteps.map((s) => s.label).join(" + ") || "Review";

  // Scope coordinator's view to their assigned programs
  let scopedFacultyIds: any[] = [];
  if (roles.includes("Coordinator")) {
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

  let pendingQuery: any = supabase
    .from("submissions")
    .select(`
      id, status, current_step, created_at, updated_at,
      assignments (
        id,
        faculty:faculty_id ( id, full_name ),
        organizations ( name ),
        requirement_instances!inner (
          id, due_date,
          requirement_templates!inner ( name, requirement_categories ( name ) ),
          semesters!inner ( name, academic_years ( label ) )
        )
      ),
      approvals ( id, step_number, step_role, status, remarks, created_at, reviewer_id )
    `)
    .in("current_step", mySteps.map((s) => s.step))
    .eq("status", "submitted");

  if (scopedFacultyIds.length > 0) {
    pendingQuery = pendingQuery.in("assignments.faculty_id", scopedFacultyIds);
  }

  const { data: pendingSubmissions } = await pendingQuery.order("updated_at", { ascending: true });

  let reviewedQuery: any = supabase
    .from("submissions")
    .select(`
      id, status, current_step, created_at, updated_at,
      assignments (
        id,
        faculty:faculty_id ( id, full_name ),
        organizations ( name ),
        requirement_instances!inner (
          id, due_date,
          requirement_templates!inner ( name, requirement_categories ( name ) ),
          semesters!inner ( name, academic_years ( label ) )
        )
      ),
      approvals!inner ( id, step_number, step_role, status, remarks, created_at, reviewer_id )
    `)
    .in("current_step", mySteps.map((s) => s.step))
    .in("status", ["completed", "needs_revision"])
    .eq("approvals.step_role", role);

  if (scopedFacultyIds.length > 0) {
    reviewedQuery = reviewedQuery.in("assignments.faculty_id", scopedFacultyIds);
  }

  const { data: reviewedSubmissions } = await reviewedQuery.order("updated_at", { ascending: false }).limit(20);

  return (
    <AppShell fullName={profile?.full_name} email={user.email} role={role} roles={roles} currentPath="/submissions/review">
      <div className="page-header">
        <h1>{stepLabel}</h1>
        <p>Submissions awaiting your review</p>
      </div>
      <div className="page-body">

        {/* Pipeline indicator */}
        <div className="card-orange" style={{ marginBottom: 24, fontSize: 13 }}>
          <strong>Workflow:</strong>{" "}
          {WORKFLOW_STEPS.map((s, i) => (
            <span key={s.label}>
              <span className={`badge ${s.roles.some((r) => roles.includes(r)) ? "badge-blue" : "badge-gray"}`}>{s.label}</span>
              {i < WORKFLOW_STEPS.length - 1 && <span style={{ color: "#d1d5db", margin: "0 4px" }}>→</span>}
            </span>
          ))}
          <span style={{ marginLeft: 4 }}>→ <span className="badge badge-green">Completed</span></span>
        </div>

        <h3 className="section-title">Pending Review ({pendingSubmissions?.length ?? 0})</h3>

        {(pendingSubmissions ?? []).length === 0 && (
          <div className="card" style={{ textAlign: "center", marginBottom: 24 }}>
            <p style={{ color: "#9ca3af" }}>No submissions pending your review.</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
          {(pendingSubmissions ?? []).map((sub: any) => {
            const a = sub.assignments;
            const ri = a?.requirement_instances;
            const facultyName = a?.faculty?.full_name ?? a?.organizations?.name ?? "Unknown";

            return (
              <div key={sub.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1f2937" }}>
                      {ri?.requirement_templates?.name}
                    </h3>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" }}>
                      Submitted by: <strong>{facultyName}</strong>
                      {" · "}{ri?.semesters?.academic_years?.label} {ri?.semesters?.name}
                      {ri?.due_date ? ` · Due: ${ri.due_date}` : ""}
                    </p>
                  </div>
                  <span className="badge badge-blue">Pending Review</span>
                </div>

                <SubFiles submissionId={sub.id} />

                <form action={async (formData: FormData) => {
                  "use server";
                  formData.set("submission_id", String(sub.id));
                  const action = formData.get("_action");
                  if (action === "approve") await approveSubmission(formData);
                  if (action === "reject") await rejectSubmission(formData);
                }} style={{ marginTop: 16, borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
                  <input type="hidden" name="submission_id" value={sub.id} />

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
                      Remarks {!roles.includes("Chair") ? "(required for rejection)" : ""}
                    </label>
                    <textarea name="remarks" rows={3} className="input" style={{ minHeight: 60 }} placeholder="Add your remarks…" />
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="submit" name="_action" value="approve" className="btn-approve">✓ Approve</button>
                    <button type="submit" name="_action" value="reject" className="btn-reject">✗ Return for Revision</button>
                  </div>
                </form>
              </div>
            );
          })}
        </div>

        {/* History */}
        {(reviewedSubmissions ?? []).length > 0 && (
          <div>
            <h3 className="section-title">Recently Reviewed</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Faculty</th>
                    <th>Decision</th>
                    <th>Remarks</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(reviewedSubmissions ?? []).map((sub: any) => {
                    const a = sub.assignments;
                    const ri = a?.requirement_instances;
                    const app = sub.approvals?.find((ap: any) => ap.step_role === role || roles.includes(ap.step_role));
                    return (
                      <tr key={sub.id}>
                        <td style={{ fontWeight: 500 }}>{ri?.requirement_templates?.name}</td>
                        <td>{a?.faculty?.full_name ?? a?.organizations?.name}</td>
                        <td>
                          <span className={`badge ${app?.status === "approved" ? "badge-green" : "badge-red"}`}>
                            {app?.status === "approved" ? "Approved" : "Returned"}
                          </span>
                        </td>
                        <td style={{ color: "#6b7280", fontSize: 13, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {app?.remarks ?? "—"}
                        </td>
                        <td style={{ color: "#9ca3af", fontSize: 13 }}>{app?.created_at ? new Date(app.created_at).toLocaleDateString() : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

async function SubFiles({ submissionId }: { submissionId: number }) {
  const supabase = await createClient();
  const { data: versions } = await supabase
    .from("submission_versions")
    .select("id, version_number, notes, created_at, submission_files ( id, file_name, file_url, file_type, file_size, storage_path )")
    .eq("submission_id", submissionId)
    .order("version_number", { ascending: false })
    .limit(3);

  if (!versions || versions.length === 0) return null;

  // Collect all storage paths and generate signed URLs in batch
  const allFiles = versions.flatMap((v: any) => v.submission_files ?? []);
  const urlMap: Record<string, string> = {};
  for (const f of allFiles) {
    if (f.storage_path) {
      const { data } = await supabase.storage.from("submissions").createSignedUrl(f.storage_path, 3600);
      if (data?.signedUrl) urlMap[f.storage_path] = data.signedUrl;
    }
  }

  return (
    <div style={{ marginTop: 12, fontSize: 13 }}>
      <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#6b7280" }}>Files:</p>
      {versions.map((v: any) => (
        <div key={v.id} style={{ marginBottom: 6, padding: "8px 12px", background: "#f9fafb", borderRadius: 6, border: "1px solid #f3f4f6" }}>
          <span style={{ fontWeight: 500, color: "#1f2937" }}>v{v.version_number}</span>
          {v.notes ? <span style={{ color: "#6b7280", marginLeft: 6 }}>— {v.notes}</span> : null}
          {v.submission_files?.map((f: any) => {
            const signedUrl = f.storage_path ? urlMap[f.storage_path] : null;
            return (
              <div key={f.id} style={{ paddingLeft: 16, marginTop: 2 }}>
                {signedUrl ? (
                  <a href={signedUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#ea580c", textDecoration: "underline" }}>
                    📄 {f.file_name}
                    {f.file_size ? ` (${(f.file_size / 1024).toFixed(0)} KB)` : ""}
                  </a>
                ) : f.file_url ? (
                  <a href={f.file_url} target="_blank" rel="noopener noreferrer" style={{ color: "#ea580c" }}>
                    {f.file_name}
                  </a>
                ) : (
                  <span style={{ color: "#6b7280" }}>{f.file_name}</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
