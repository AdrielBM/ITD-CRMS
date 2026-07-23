import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/auth/permissions";
import AppShell from "@/components/AppShell";
import { createSubmission, submitRequirement } from "./actions";

const STATUS_BADGE = {
  draft: "badge badge-gray",
  submitted: "badge badge-blue",
  needs_revision: "badge badge-red",
  completed: "badge badge-green",
};

const STATUS_LABEL = {
  draft: "Draft",
  submitted: "Under Review",
  needs_revision: "Needs Revision",
  completed: "Completed",
};

const WORKFLOW_STEPS = ["Coordinator", "Records", "Secretary", "Chair"];

export default async function SubmissionsPage() {
  const supabase = await createClient();
  const { user, role, roles, profile } = await getCurrentUserAccess(supabase);
  if (!user) redirect("/login");

  const isFaculty = roles.includes("Faculty");

  let query = supabase.from("assignments").select(`
    id,
    requirement_instances!inner (
      id, due_date,
      requirement_templates!inner ( name, requirement_categories ( name ) ),
      semesters!inner ( name, academic_years ( label ) )
    ),
    submissions ( id, status, current_step, updated_at )
  `);

  if (isFaculty) query = query.eq("faculty_id", user.id);

  const { data: activeSemester } = await supabase.from("semesters").select("id").eq("is_active", true).single();
  if (activeSemester) query = query.eq("requirement_instances.semester_id", activeSemester.id);

  const { data: assignments } = await query.order("requirement_instances.requirement_templates(name)");

  return (
    <AppShell fullName={profile?.full_name} email={user.email} role={role} roles={roles} currentPath="/submissions">
      <div className="page-header">
        <h1>Submissions</h1>
        <p>{isFaculty ? "Your requirements — submit files for review" : "All submissions across the department"}</p>
      </div>
      <div className="page-body">
        {(assignments ?? []).length === 0 && (
          <div className="card" style={{ textAlign: "center" }}><p style={{ color: "#9ca3af" }}>No assignments yet this semester.</p></div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(assignments ?? []).map((a) => {
            const ri = a.requirement_instances;
            const sub = a.submissions?.[0];
            const canSubmit = isFaculty && (!sub || sub.status === "draft" || sub.status === "needs_revision");
            const needsRevision = sub?.status === "needs_revision";
            const activeStep = sub?.current_step != null && sub.status === "submitted" ? WORKFLOW_STEPS[sub.current_step] : null;

            return (
              <div key={a.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1f2937" }}>
                      {ri?.requirement_templates?.name}
                    </h3>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" }}>
                      {ri?.requirement_templates?.requirement_categories?.name}
                      {" · "}{ri?.semesters?.academic_years?.label} {ri?.semesters?.name}
                      {ri?.due_date ? ` · Due: ${ri.due_date}` : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {sub && <span className={STATUS_BADGE[sub.status] ?? "badge badge-gray"}>{STATUS_LABEL[sub.status] ?? sub.status}</span>}
                    {!sub && <span className="badge badge-gray">Not Started</span>}
                  </div>
                </div>

                {activeStep && (
                  <div style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>
                    Awaiting <strong>{activeStep}</strong> approval
                  </div>
                )}

                {sub && sub.status !== "draft" && (
                  <SubFilesInline submissionId={sub.id} />
                )}

                {sub?.status === "completed" && (
                  <div style={{ marginTop: 12, fontSize: 13, color: "#16a34a", fontWeight: 500 }}>✓ Fully approved</div>
                )}

                {canSubmit && (
                  <form action={async (formData) => {
                    "use server";
                    if (!sub) {
                      const { submissionId } = await createSubmission(formData);
                      formData.set("submission_id", String(submissionId));
                    } else {
                      formData.set("submission_id", String(sub.id));
                    }
                    return submitRequirement(formData);
                  }} style={{ marginTop: 16, borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
                    <input type="hidden" name="assignment_id" value={a.id} />
                    {sub && <input type="hidden" name="submission_id" value={sub.id} />}

                    {needsRevision && (
                      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#dc2626" }}>
                        This submission was returned. Please address the remarks and resubmit.
                      </p>
                    )}

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                        Upload Files (PDF, Word, Excel, Images)
                      </label>
                      <input
                        type="file"
                        name="files"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.ppt,.pptx"
                        className="input"
                        style={{ padding: "8px 14px" }}
                      />
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>
                        Files are stored securely in the department&rsquo;s private storage
                      </p>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <input name="notes" placeholder="Submission notes (optional)" className="input" />
                    </div>

                    <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                      {sub?.status === "needs_revision" ? "Resubmit" : "Submit for Review"}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

/** Shows uploaded files for a submission (faculty view) */
async function SubFilesInline({ submissionId }) {
  const supabase = await createClient();
  const { data: versions } = await supabase
    .from("submission_versions")
    .select("id, version_number, notes, created_at, submission_files ( id, file_name, file_url, file_type, file_size, storage_path )")
    .eq("submission_id", submissionId)
    .order("version_number", { ascending: false })
    .limit(3);

  if (!versions || versions.length === 0) return null;

  const allFiles = versions.flatMap((v) => v.submission_files ?? []);
  const urlMap = {};
  for (const f of allFiles) {
    if (f.storage_path) {
      const { data } = await supabase.storage.from("submissions").createSignedUrl(f.storage_path, 3600);
      if (data?.signedUrl) urlMap[f.storage_path] = data.signedUrl;
    }
  }

  return (
    <div style={{ marginTop: 12, padding: "12px", background: "#f9fafb", borderRadius: 8, fontSize: 13 }}>
      <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#6b7280" }}>Uploaded Files:</p>
      {versions.map((v) => (
        <div key={v.id} style={{ marginBottom: 4 }}>
          <span style={{ fontWeight: 500, color: "#1f2937" }}>v{v.version_number}</span>
          {v.notes ? <span style={{ color: "#6b7280", marginLeft: 6 }}>— {v.notes}</span> : null}
          {v.submission_files?.map((f) => {
            const signedUrl = f.storage_path ? urlMap[f.storage_path] : null;
            return (
              <div key={f.id} style={{ paddingLeft: 16, color: "#6b7280" }}>
                {signedUrl ? (
                  <a href={signedUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#ea580c" }}>
                    📄 {f.file_name}
                  </a>
                ) : (
                  <span>{f.file_name}</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
