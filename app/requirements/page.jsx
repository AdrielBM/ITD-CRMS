import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess, can } from "@/lib/auth/permissions";
import AppShell from "@/components/AppShell";
import {
  createCategory,
  createTemplate,
  toggleTemplateActive,
  deleteTemplate,
  createInstance,
  deleteInstance,
  bulkGenerateInstances,
  bulkAssignAllFacultyForSemester,
  createAssignment,
  deleteAssignment,
} from "./actions";

export default async function RequirementsPage() {
  const supabase = await createClient();
  const { user, role, profile, permissions } = await getCurrentUserAccess(supabase);
  if (!user) redirect("/login");

  const canWrite = can(permissions, "Requirements", "CRUD");

  const [
    { data: categories },
    { data: templates },
    { data: semesters },
    { data: instances },
    { data: assignments },
    { data: faculty },
    { data: organizations },
  ] = await Promise.all([
    supabase.from("requirement_categories").select("*").order("name"),
    supabase.from("requirement_templates").select("*, requirement_categories ( name )").order("name"),
    supabase.from("semesters").select("id, name, academic_years ( label )").order("id", { ascending: false }),
    supabase.from("requirement_instances").select("*, requirement_templates ( name ), semesters ( name, academic_years ( label ) )").order("id", { ascending: false }),
    supabase.from("assignments").select("id, requirement_instances ( id, requirement_templates ( name ), semesters ( name ) ), faculty:faculty_id ( full_name ), organizations ( name )").order("id", { ascending: false }),
    supabase.from("users").select("id, full_name, roles!inner(name)").eq("roles.name", "Faculty").order("full_name"),
    supabase.from("organizations").select("id, name").order("name"),
  ]);

  return (
    <AppShell fullName={profile?.full_name} email={user.email} role={role} currentPath="/requirements">
      <div className="page-header">
        <h1>Requirement Management</h1>
        <p>Categories, templates, instances, and assignments across semesters</p>
      </div>
      <div className="page-body">
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Semester Setup */}
          {canWrite && (
            <div className="card-orange">
              <h3 className="section-title" style={{ borderColor: "#fed7aa", marginTop: 0 }}>Semester Setup</h3>
              <p style={{ margin: "-8px 0 16px", fontSize: 14, color: "#9a3412" }}>
                Generate an instance of every active template, then assign all current faculty — safe to re-run, nothing gets duplicated.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <form action={bulkGenerateInstances} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select name="semester_id" required className="input" style={{ width: "auto", minWidth: 200 }}>
                    <option value="">Select semester…</option>
                    {(semesters ?? []).map((s) => (
                      <option key={s.id} value={s.id}>{s.academic_years?.label} · {s.name}</option>
                    ))}
                  </select>
                  <button className="btn btn-secondary btn-sm">Generate Instances</button>
                </form>
                <form action={bulkAssignAllFacultyForSemester} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select name="semester_id" required className="input" style={{ width: "auto", minWidth: 200 }}>
                    <option value="">Select semester…</option>
                    {(semesters ?? []).map((s) => (
                      <option key={s.id} value={s.id}>{s.academic_years?.label} · {s.name}</option>
                    ))}
                  </select>
                  <button className="btn btn-secondary btn-sm">Assign All Faculty</button>
                </form>
              </div>
            </div>
          )}

          {/* Categories */}
          <section>
            <h3 className="section-title">Categories</h3>
            <div className="card">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: canWrite ? 16 : 0 }}>
                {(categories ?? []).map((c) => (
                  <span key={c.id} className="badge badge-gray" style={{ padding: "6px 16px" }}>{c.name}</span>
                ))}
                {(categories ?? []).length === 0 && <span style={{ color: "#9ca3af", fontSize: 14 }}>No categories yet.</span>}
              </div>
              {canWrite && (
                <form action={createCategory} style={{ display: "flex", gap: 8 }}>
                  <input name="name" placeholder="New category name" required className="input" style={{ maxWidth: 300 }} />
                  <button className="btn btn-primary btn-sm">Add</button>
                </form>
              )}
            </div>
          </section>

          {/* Templates */}
          <section>
            <h3 className="section-title">Requirement Templates</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(templates ?? []).map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 500 }}>{t.name}</td>
                      <td style={{ color: "#6b7280" }}>{t.requirement_categories?.name ?? "—"}</td>
                      <td>
                        {canWrite ? (
                          <form action={toggleTemplateActive}>
                            <input type="hidden" name="id" value={t.id} />
                            <input type="hidden" name="is_active" value={String(t.is_active)} />
                            <button className={`badge ${t.is_active ? "badge-green" : "badge-gray"}`} style={{ border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                              {t.is_active ? "Active" : "Inactive"}
                            </button>
                          </form>
                        ) : (
                          <span className={`badge ${t.is_active ? "badge-green" : "badge-gray"}`}>{t.is_active ? "Active" : "Inactive"}</span>
                        )}
                      </td>
                      <td>
                        {canWrite && (
                          <form action={deleteTemplate}>
                            <input type="hidden" name="id" value={t.id} />
                            <button className="btn btn-danger btn-sm">Delete</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(templates ?? []).length === 0 && (
                    <tr><td colSpan={4} className="empty-state">No templates yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {canWrite && (
              <form action={createTemplate} style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input name="name" placeholder="Template name" required className="input" style={{ flex: 2 }} />
                <select name="category_id" className="input" style={{ flex: 1 }}>
                  <option value="">Category…</option>
                  {(categories ?? []).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
                <button className="btn btn-primary btn-sm">Add</button>
              </form>
            )}
          </section>

          {/* Instances */}
          <section>
            <h3 className="section-title">Requirement Instances</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Template</th>
                    <th>Semester</th>
                    <th>Due Date</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(instances ?? []).map((i) => (
                    <tr key={i.id}>
                      <td style={{ fontWeight: 500 }}>{i.requirement_templates?.name}</td>
                      <td>{i.semesters?.academic_years?.label} · {i.semesters?.name}</td>
                      <td>{i.due_date ?? "—"}</td>
                      <td>
                        {canWrite && (
                          <form action={deleteInstance}>
                            <input type="hidden" name="id" value={i.id} />
                            <button className="btn btn-danger btn-sm">Delete</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(instances ?? []).length === 0 && (
                    <tr><td colSpan={4} className="empty-state">No instances generated yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {canWrite && (
              <form action={createInstance} style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <select name="template_id" required className="input" style={{ flex: 1, minWidth: 160 }}>
                  <option value="">Template…</option>
                  {(templates ?? []).filter((t) => t.is_active).map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                </select>
                <select name="semester_id" required className="input" style={{ flex: 1, minWidth: 160 }}>
                  <option value="">Semester…</option>
                  {(semesters ?? []).map((s) => (<option key={s.id} value={s.id}>{s.academic_years?.label} · {s.name}</option>))}
                </select>
                <input name="due_date" type="date" className="input" style={{ flex: 1, minWidth: 140 }} />
                <button className="btn btn-primary btn-sm">Generate</button>
              </form>
            )}
          </section>

          {/* Assignments */}
          <section>
            <h3 className="section-title">Assignments</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Assigned To</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(assignments ?? []).map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 500 }}>{a.requirement_instances?.requirement_templates?.name} — {a.requirement_instances?.semesters?.name}</td>
                      <td>{a.faculty?.full_name ?? a.organizations?.name ?? "—"}</td>
                      <td>
                        {canWrite && (
                          <form action={deleteAssignment}>
                            <input type="hidden" name="id" value={a.id} />
                            <button className="btn btn-danger btn-sm">Delete</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(assignments ?? []).length === 0 && (
                    <tr><td colSpan={3} className="empty-state">No assignments yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {canWrite && (
              <form action={createAssignment} style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <select name="requirement_instance_id" required className="input" style={{ flex: 2, minWidth: 200 }}>
                  <option value="">Requirement instance…</option>
                  {(instances ?? []).map((i) => (<option key={i.id} value={i.id}>{i.requirement_templates?.name} · {i.semesters?.academic_years?.label} {i.semesters?.name}</option>))}
                </select>
                <select name="assignee_type" required className="input" style={{ flex: 1, minWidth: 100 }}>
                  <option value="faculty">Faculty</option>
                  <option value="organization">Organization</option>
                </select>
                <select name="assignee_id" required className="input" style={{ flex: 2, minWidth: 160 }}>
                  <optgroup label="Faculty">
                    {(faculty ?? []).map((f) => (<option key={`f-${f.id}`} value={f.id}>{f.full_name}</option>))}
                  </optgroup>
                  <optgroup label="Organizations">
                    {(organizations ?? []).map((o) => (<option key={`o-${o.id}`} value={o.id}>{o.name}</option>))}
                  </optgroup>
                </select>
                <button className="btn btn-primary btn-sm">Assign</button>
              </form>
            )}
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "#9ca3af" }}>Select &ldquo;Faculty&rdquo; or &ldquo;Organization&rdquo; to match the name you pick below.</p>
          </section>

        </div>
      </div>
    </AppShell>
  );
}
