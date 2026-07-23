import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess, can } from "@/lib/auth/permissions";
import AppShell from "@/components/AppShell";
import {
  createProgram, deleteProgram,
  createAcademicYear, setActiveAcademicYear, deleteAcademicYear,
  createSemester, setActiveSemester, deleteSemester,
  assignProgramCoordinator, removeProgramCoordinator,
} from "./actions";

export default async function AcademicSettingsPage() {
  const supabase = await createClient();
  const { user, role, roles, profile, permissions } = await getCurrentUserAccess(supabase);
  if (!user) redirect("/login");

  const canWritePrograms = can(permissions, "Programs", "CRUD");

  const [
    { data: programs },
    { data: academicYears },
    { data: semesters },
    { data: coordinators },
    { data: coordinatorUsers },
  ] = await Promise.all([
    supabase.from("programs").select("*").is("deleted_at", null).order("name"),
    supabase.from("academic_years").select("*").is("deleted_at", null).order("label", { ascending: false }),
    supabase.from("semesters").select("*, academic_years ( label )").is("deleted_at", null).order("academic_year_id", { ascending: false }),
    supabase.from("program_coordinators").select("*, user:users!user_id(id, email, full_name), program:programs!program_id(name)"),
    supabase.from("users").select("id, email, full_name, user_roles!inner(role:roles!role_id(name))").eq("user_roles.role.name", "Coordinator"),
  ]);

  return (
    <AppShell fullName={profile?.full_name} email={user.email} role={role} roles={roles} currentPath="/settings/academic">
      <div className="page-header">
        <h1>Academic Structure</h1>
        <p>Programs, academic years, and semesters</p>
      </div>
      <div className="page-body">
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Programs */}
          <section>
            <h3 className="section-title">Programs</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Coordinators</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(programs ?? []).map((p) => {
                    const progCoords = (coordinators ?? []).filter((c) => c.program_id === p.id);
                    const unassigned = (coordinators ?? []).filter((c) => c.program_id === null);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                        <td><span className="badge badge-gray">{p.code}</span></td>
                        <td>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                            {progCoords.map((pc) => (
                              <span key={pc.id} className="badge badge-blue" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                {pc.user?.full_name ?? pc.user?.email}
                                {canWritePrograms && (
                                  <form action={removeProgramCoordinator} style={{ display: "inline" }}>
                                    <input type="hidden" name="id" value={pc.id} />
                                    <button type="submit" style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1 }} title="Remove">×</button>
                                  </form>
                                )}
                              </span>
                            ))}
                            {canWritePrograms && (
                              <form action={assignProgramCoordinator} style={{ display: "inline-flex", gap: 4 }}>
                                <input type="hidden" name="program_id" value={p.id} />
                                <select name="user_id" required className="input" style={{ padding: "2px 6px", fontSize: 12, maxWidth: 180 }}>
                                  <option value="">Assign coordinator…</option>
                                  {(coordinatorUsers ?? [])
                                    .filter((u) => !progCoords.some((pc) => pc.user_id === u.id) && !unassigned.some((uc) => uc.user_id === u.id))
                                    .map((u) => <option key={u.id} value={u.id}>{u.full_name ?? u.email}</option>)}
                                </select>
                                <button className="btn btn-primary btn-sm" style={{ padding: "2px 10px", fontSize: 12 }}>Assign</button>
                              </form>
                            )}
                          </div>
                        </td>
                        <td>
                          {canWritePrograms && (
                            <form action={deleteProgram}>
                              <input type="hidden" name="id" value={p.id} />
                              <button className="btn btn-danger btn-sm">Delete</button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {(programs ?? []).length === 0 && <tr><td colSpan={4} className="empty-state">No programs yet.</td></tr>}
                </tbody>
              </table>
            </div>
            {canWritePrograms && (
              <form action={createProgram} style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input name="name" placeholder="Program name" required className="input" style={{ flex: 2 }} />
                <input name="code" placeholder="Code (e.g. BSIT)" required className="input" style={{ flex: 1, maxWidth: 140 }} />
                <button className="btn btn-primary btn-sm">Add</button>
              </form>
            )}
            {/* Department-wide Coordinators (program_id = null) */}
            {canWritePrograms && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>Department-wide Coordinators (all programs)</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  {(coordinators ?? []).filter((c) => c.program_id === null).map((pc) => (
                    <span key={pc.id} className="badge badge-blue" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {pc.user?.full_name ?? pc.user?.email}
                      <form action={removeProgramCoordinator} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={pc.id} />
                        <button type="submit" style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1 }} title="Remove">×</button>
                      </form>
                    </span>
                  ))}
                  <form action={assignProgramCoordinator} style={{ display: "inline-flex", gap: 4 }}>
                    <input type="hidden" name="program_id" value="" />
                    <select name="user_id" required className="input" style={{ padding: "2px 6px", fontSize: 12, maxWidth: 180 }}>
                      <option value="">Assign department-wide coordinator…</option>
                      {(coordinatorUsers ?? [])
                        .filter((u) => !(coordinators ?? []).some((c) => c.user_id === u.id))
                        .map((u) => <option key={u.id} value={u.id}>{u.full_name ?? u.email}</option>)}
                    </select>
                    <button className="btn btn-primary btn-sm" style={{ padding: "2px 10px", fontSize: 12 }}>Assign</button>
                  </form>
                </div>
              </div>
            )}
          </section>

          {/* Academic Years */}
          <section>
            <h3 className="section-title">Academic Years</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Active</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(academicYears ?? []).map((ay) => (
                    <tr key={ay.id}>
                      <td style={{ fontWeight: 500 }}>{ay.label}</td>
                      <td>
                        {ay.is_active ? (
                          <span className="badge badge-green">Active</span>
                        ) : canWritePrograms ? (
                          <form action={setActiveAcademicYear}>
                            <input type="hidden" name="id" value={ay.id} />
                            <button className="btn btn-outline btn-sm">Set Active</button>
                          </form>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: 13 }}>—</span>
                        )}
                      </td>
                      <td>
                        {canWritePrograms && (
                          <form action={deleteAcademicYear}>
                            <input type="hidden" name="id" value={ay.id} />
                            <button className="btn btn-danger btn-sm">Delete</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(academicYears ?? []).length === 0 && <tr><td colSpan={3} className="empty-state">No academic years yet.</td></tr>}
                </tbody>
              </table>
            </div>
            {canWritePrograms && (
              <form action={createAcademicYear} style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <input name="label" placeholder="e.g. 2026-2027" required className="input" style={{ flex: 1, minWidth: 140 }} />
                <input name="start_date" type="date" className="input" style={{ flex: 1, minWidth: 140 }} />
                <input name="end_date" type="date" className="input" style={{ flex: 1, minWidth: 140 }} />
                <button className="btn btn-primary btn-sm">Add</button>
              </form>
            )}
          </section>

          {/* Semesters */}
          <section>
            <h3 className="section-title">Semesters</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Academic Year</th>
                    <th>Semester</th>
                    <th>Active</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(semesters ?? []).map((s) => (
                    <tr key={s.id}>
                      <td>{s.academic_years?.label}</td>
                      <td style={{ fontWeight: 500 }}>{s.name}</td>
                      <td>
                        {s.is_active ? (
                          <span className="badge badge-green">Active</span>
                        ) : canWritePrograms ? (
                          <form action={setActiveSemester}>
                            <input type="hidden" name="id" value={s.id} />
                            <input type="hidden" name="academic_year_id" value={s.academic_year_id} />
                            <button className="btn btn-outline btn-sm">Set Active</button>
                          </form>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: 13 }}>—</span>
                        )}
                      </td>
                      <td>
                        {canWritePrograms && (
                          <form action={deleteSemester}>
                            <input type="hidden" name="id" value={s.id} />
                            <button className="btn btn-danger btn-sm">Delete</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(semesters ?? []).length === 0 && <tr><td colSpan={4} className="empty-state">No semesters yet.</td></tr>}
                </tbody>
              </table>
            </div>
            {canWritePrograms && (
              <form action={createSemester} style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <select name="academic_year_id" required className="input" style={{ flex: 1 }}>
                  <option value="">Academic year…</option>
                  {(academicYears ?? []).map((ay) => (<option key={ay.id} value={ay.id}>{ay.label}</option>))}
                </select>
                <select name="name" required className="input" style={{ flex: 1 }}>
                  <option value="First Semester">First Semester</option>
                  <option value="Second Semester">Second Semester</option>
                  <option value="Summer">Summer</option>
                </select>
                <button className="btn btn-primary btn-sm">Add</button>
              </form>
            )}
          </section>

        </div>
      </div>
    </AppShell>
  );
}
